const db = require('../config/database');
const BaseController = require('./baseController');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

class OrderController extends BaseController {
  /**
   * 创建订单
   */
  async createOrder(req, res) {
    const connection = await db.getConnection();
    
    try {
      const userId = req.userData.userId;
      const { contact_name, contact_phone, address, note, cart_items } = req.body;
      
      // 开始事务
      await connection.beginTransaction();
      
      // 请求验证
      if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '订单商品不能为空'
        });
      }
      
      // 验证商品是否存在且有足够库存
      const itemIds = cart_items.map(item => parseInt(item));
      const placeholders = itemIds.map(() => '?').join(',');
      
      // 获取用户购物车
      const [carts] = await connection.execute(
        'SELECT id FROM carts WHERE user_id = ?',
        [userId]
      );
      
      if (carts.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '购物车不存在'
        });
      }
      
      const cartId = carts[0].id;
      
      // 获取购物车商品信息
      const [cartItems] = await connection.execute(
        `SELECT 
          ci.id, ci.product_id, ci.quantity,
          p.title, p.price, p.stock, p.images, p.unit, p.is_bulk, p.min_order_quantity
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.id IN (${placeholders}) AND ci.cart_id = ? AND p.status = 1`,
        [...itemIds, cartId]
      );
      
      if (cartItems.length !== itemIds.length) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '部分商品不存在或已下架'
        });
      }
      
      // 检查库存和批量订购限制
      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `商品 "${item.title}" 库存不足`
          });
        }
        
        if (item.is_bulk && item.quantity < item.min_order_quantity) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `商品 "${item.title}" 最低起订数量为${item.min_order_quantity}${item.unit}`
          });
        }
      }
      
      // 计算订单总金额
      let totalAmount = 0;
      for (const item of cartItems) {
        totalAmount += item.price * item.quantity;
      }
      totalAmount = parseFloat(totalAmount.toFixed(2));
      
      // 生成订单编号
      const orderNo = `O${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // 创建订单
      const [orderResult] = await connection.execute(
        `INSERT INTO orders 
          (order_no, user_id, total_amount, contact_name, contact_phone, address, note) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderNo, userId, totalAmount, contact_name, contact_phone, address, note || null]
      );
      
      const orderId = orderResult.insertId;
      
      // 创建订单项
      const orderItems = cartItems.map(item => {
        let firstImage = null;
        if (item.images) {
          try {
            const images = JSON.parse(item.images || '[]');
            firstImage = images.length > 0 ? images[0] : null;
          } catch (e) {
            // 如果JSON解析失败，设置默认图片为空
            firstImage = null;
          }
        }
        
        return [
          orderId,
          item.product_id,
          item.title,
          firstImage,
          item.price,
          item.quantity,
          parseFloat((item.price * item.quantity).toFixed(2))
        ];
      });
      
      await connection.query(
        `INSERT INTO order_items 
          (order_id, product_id, product_title, product_image, price, quantity, total_amount) 
         VALUES ?`,
        [orderItems]
      );
      
      // 更新商品库存和销量
      for (const item of cartItems) {
        await connection.execute(
          `UPDATE products 
           SET 
            stock = stock - ?,
            sales_count = sales_count + ?,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [item.quantity, item.quantity, item.product_id]
        );
      }
      
      // 从购物车中删除已购买的商品
      await connection.execute(
        `DELETE FROM cart_items WHERE id IN (${placeholders})`,
        itemIds
      );
      
      // 提交事务
      await connection.commit();
      
      return res.status(201).json({
        success: true,
        message: '订单创建成功',
        order: {
          id: orderId,
          order_no: orderNo,
          total_amount: totalAmount
        }
      });
    } catch (error) {
      await connection.rollback();
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '创建订单失败，请重试'
      });
    } finally {
      connection.release();
    }
  }

  /**
   * 获取订单列表
   */
  async getOrderList(req, res) {
    try {
      const userId = req.userData.userId;
      const { page, limit, skip } = this.getPaginationParams(req);
      const status = req.query.status ? parseInt(req.query.status) : null;
      
      // 构建查询条件
      let whereClause = 'WHERE o.user_id = ?';
      let params = [userId];
      
      if (status !== null) {
        whereClause += ' AND o.status = ?';
        params.push(status);
      }
      
      // 获取订单总数
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
        params
      );
      const total = countResult[0].total;
      
      // 获取订单列表
      const [orders] = await db.execute(
        `SELECT 
          o.id, o.order_no, o.total_amount, o.status, 
          o.contact_name, o.contact_phone, o.address,
          o.payment_method, o.payment_time, o.created_at,
          o.shipping_time, o.completion_time
         FROM orders o
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      );
      
      // 获取每个订单的商品信息
      for (const order of orders) {
        const [items] = await db.execute(
          `SELECT 
            oi.id, oi.product_id, oi.product_title, oi.product_image,
            oi.price, oi.quantity, oi.total_amount
           FROM order_items oi
           WHERE oi.order_id = ?
           ORDER BY oi.id ASC`,
          [order.id]
        );
        
        order.items = items;
        
        // 获取订单状态对应的文本描述
        order.status_text = this.getOrderStatusText(order.status);
      }
      
      return this.paginate(res, orders, total, page, limit);
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '获取订单列表失败，请重试'
      });
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(req, res) {
    try {
      const userId = req.userData.userId;
      const orderId = req.params.orderId;
      
      // 获取订单信息
      const [orders] = await db.execute(
        `SELECT 
          o.id, o.order_no, o.total_amount, o.status,
          o.contact_name, o.contact_phone, o.address, o.note,
          o.payment_method, o.payment_time, o.shipping_time, 
          o.completion_time, o.created_at, o.updated_at
         FROM orders o
         WHERE o.id = ? AND o.user_id = ?`,
        [orderId, userId]
      );
      
      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      const order = orders[0];
      
      // 获取订单商品
      const [items] = await db.execute(
        `SELECT 
          oi.id, oi.product_id, oi.product_title, oi.product_image,
          oi.price, oi.quantity, oi.total_amount
         FROM order_items oi
         WHERE oi.order_id = ?
         ORDER BY oi.id ASC`,
        [orderId]
      );
      
      order.items = items;
      
      // 获取订单状态对应的文本描述
      order.status_text = this.getOrderStatusText(order.status);
      
      return this.success(res, order);
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '获取订单详情失败，请重试'
      });
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(req, res) {
    const connection = await db.getConnection();
    
    try {
      const userId = req.userData.userId;
      const orderId = req.params.orderId;
      
      // 开始事务
      await connection.beginTransaction();
      
      // 获取订单信息
      const [orders] = await connection.execute(
        'SELECT id, status FROM orders WHERE id = ? AND user_id = ?',
        [orderId, userId]
      );
      
      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      const order = orders[0];
      
      // 判断订单状态是否可取消
      if (order.status !== 0) {
        return res.status(400).json({
          success: false,
          message: '只有待付款订单可以取消'
        });
      }
      
      // 获取订单商品
      const [items] = await connection.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );
      
      // 更新商品库存
      for (const item of items) {
        await connection.execute(
          `UPDATE products 
           SET 
            stock = stock + ?,
            sales_count = sales_count - ?,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [item.quantity, item.quantity, item.product_id]
        );
      }
      
      // 更新订单状态
      await connection.execute(
        'UPDATE orders SET status = 4, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [orderId]
      );
      
      // 提交事务
      await connection.commit();
      
      return res.json({
        success: true,
        message: '订单已取消'
      });
    } catch (error) {
      await connection.rollback();
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '取消订单失败，请重试'
      });
    } finally {
      connection.release();
    }
  }

  /**
   * 确认收货
   */
  async confirmReceived(req, res) {
    const connection = await db.getConnection();
    
    try {
      const userId = req.userData.userId;
      const orderId = req.params.orderId;
      
      // 开始事务
      await connection.beginTransaction();
      
      // 获取订单信息
      const [orders] = await connection.execute(
        'SELECT id, status FROM orders WHERE id = ? AND user_id = ?',
        [orderId, userId]
      );
      
      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      const order = orders[0];
      
      // 判断订单状态是否可确认收货
      if (order.status !== 2) {
        return res.status(400).json({
          success: false,
          message: '只有已发货订单可以确认收货'
        });
      }
      
      // 更新订单状态
      await connection.execute(
        'UPDATE orders SET status = 3, completion_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [orderId]
      );
      
      // 提交事务
      await connection.commit();
      
      return res.json({
        success: true,
        message: '订单已完成'
      });
    } catch (error) {
      await connection.rollback();
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '确认收货失败，请重试'
      });
    } finally {
      connection.release();
    }
  }

  /**
   * 支付订单
   */
  async payOrder(req, res) {
    const connection = await db.getConnection();
    
    try {
      const userId = req.userData.userId;
      const orderId = req.params.orderId;
      const { payment_method } = req.body;
      
      // 开始事务
      await connection.beginTransaction();
      
      // 获取订单信息
      const [orders] = await connection.execute(
        'SELECT id, status FROM orders WHERE id = ? AND user_id = ?',
        [orderId, userId]
      );
      
      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      const order = orders[0];
      
      // 判断订单状态是否可支付
      if (order.status !== 0) {
        return res.status(400).json({
          success: false,
          message: '只有待付款订单可以支付'
        });
      }
      
      // 更新订单状态
      await connection.execute(
        'UPDATE orders SET status = 1, payment_method = ?, payment_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [payment_method, orderId]
      );
      
      // 提交事务
      await connection.commit();
      
      return res.json({
        success: true,
        message: '订单支付成功'
      });
    } catch (error) {
      await connection.rollback();
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '支付订单失败，请重试'
      });
    } finally {
      connection.release();
    }
  }

  /**
   * 获取订单统计
   */
  async getOrderStats(req, res) {
    try {
      const userId = req.userData.userId;
      
      // 获取各状态订单数量
      const [stats] = await db.execute(
        `SELECT 
          status, COUNT(*) as count
         FROM orders
         WHERE user_id = ?
         GROUP BY status`,
        [userId]
      );
      
      // 构建结果
      const result = {
        pending_payment: 0, // 待付款
        pending_shipment: 0, // 待发货
        pending_receipt: 0, // 待收货
        completed: 0, // 已完成
        cancelled: 0, // 已取消
        total: 0 // 总订单数
      };
      
      stats.forEach(item => {
        switch (item.status) {
          case 0:
            result.pending_payment = item.count;
            break;
          case 1:
            result.pending_shipment = item.count;
            break;
          case 2:
            result.pending_receipt = item.count;
            break;
          case 3:
            result.completed = item.count;
            break;
          case 4:
            result.cancelled = item.count;
            break;
        }
        
        result.total += item.count;
      });
      
      return this.success(res, result);
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '获取订单统计失败，请重试'
      });
    }
  }

  /**
   * 获取订单状态文本
   */
  getOrderStatusText(status) {
    const statusMap = {
      0: '待付款',
      1: '待发货',
      2: '已发货',
      3: '已完成',
      4: '已取消',
      5: '已退款'
    };
    
    return statusMap[status] || '未知状态';
  }
}

module.exports = new OrderController(); 