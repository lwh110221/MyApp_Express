const db = require('../config/database');
const BaseController = require('./baseController');

class CartController extends BaseController {
  /**
   * 获取用户购物车
   */
  async getCart(req, res) {
    try {
      const userId = req.userData.userId;
      
      // 获取用户购物车，如果不存在则创建
      let [carts] = await db.execute(
        'SELECT id FROM carts WHERE user_id = ?',
        [userId]
      );
      
      let cartId;
      if (carts.length === 0) {
        // 创建购物车
        const [result] = await db.execute(
          'INSERT INTO carts (user_id) VALUES (?)',
          [userId]
        );
        cartId = result.insertId;
      } else {
        cartId = carts[0].id;
      }
      
      // 获取购物车商品
      const [items] = await db.execute(
        `SELECT 
          ci.id, ci.product_id, ci.quantity, ci.selected,
          p.title, p.price, p.original_price, p.stock, p.unit, p.images
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = ? AND p.status = 1
         ORDER BY ci.created_at DESC`,
        [cartId]
      );
      
      // 处理图片字段
      items.forEach(item => {
        if (item.images) {
          try {
            item.images = JSON.parse(item.images);
            // 只取第一张图片
            item.image = item.images[0] || '';
            delete item.images;
          } catch (e) {
            // 如果JSON解析失败，设置默认值
            item.image = '';
            delete item.images;
          }
        }
        
        // 计算小计金额
        item.total_price = (item.price * item.quantity).toFixed(2);
      });
      
      // 计算选中商品的总金额
      const total = items
        .filter(item => item.selected === 1)
        .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
        .toFixed(2);
      
      return this.success(res, {
        cart_id: cartId,
        items,
        total,
        item_count: items.length
      });
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '获取购物车失败，请重试'
      });
    }
  }

  /**
   * 添加商品到购物车
   */
  async addToCart(req, res) {
    const connection = await db.getConnection();
    
    try {
      const userId = req.userData.userId;
      const { product_id, quantity = 1 } = req.body;
      
      // 验证商品是否存在且上架中
      const [products] = await connection.execute(
        'SELECT id, stock, is_bulk, min_order_quantity, unit FROM products WHERE id = ? AND status = 1',
        [product_id]
      );
      
      if (products.length === 0) {
        return res.status(400).json({
          success: false,
          message: '商品不存在或已下架'
        });
      }
      
      const product = products[0];
      
      // 验证库存
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: '商品库存不足'
        });
      }
      
      // 验证最低起订量
      if (product.is_bulk && quantity < product.min_order_quantity) {
        return res.status(400).json({
          success: false,
          message: `该商品最低起订数量为${product.min_order_quantity}${product.unit}`
        });
      }
      
      // 开始事务
      await connection.beginTransaction();
      
      // 获取或创建购物车
      let [carts] = await connection.execute(
        'SELECT id FROM carts WHERE user_id = ?',
        [userId]
      );
      
      let cartId;
      if (carts.length === 0) {
        // 创建购物车
        const [result] = await connection.execute(
          'INSERT INTO carts (user_id) VALUES (?)',
          [userId]
        );
        cartId = result.insertId;
      } else {
        cartId = carts[0].id;
      }
      
      // 检查商品是否已在购物车中
      const [existingItems] = await connection.execute(
        'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
        [cartId, product_id]
      );
      
      if (existingItems.length > 0) {
        // 更新数量
        const newQuantity = existingItems[0].quantity + quantity;
        
        // 再次验证库存
        if (product.stock < newQuantity) {
          return res.status(400).json({
            success: false,
            message: '商品库存不足'
          });
        }
        
        await connection.execute(
          'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newQuantity, existingItems[0].id]
        );
      } else {
        // 添加新商品
        await connection.execute(
          'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
          [cartId, product_id, quantity]
        );
      }
      
      // 提交事务
      await connection.commit();
      
      return res.status(201).json({
        success: true,
        message: '商品已添加到购物车'
      });
    } catch (error) {
      await connection.rollback();
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '添加购物车失败，请重试'
      });
    } finally {
      connection.release();
    }
  }

  /**
   * 更新购物车商品数量
   */
  async updateCartItem(req, res) {
    try {
      const userId = req.userData.userId;
      const itemId = req.params.itemId;
      const { quantity } = req.body;
      
      // 验证用户购物车
      const [carts] = await db.execute(
        'SELECT id FROM carts WHERE user_id = ?',
        [userId]
      );
      
      if (carts.length === 0) {
        return res.status(400).json({
          success: false,
          message: '购物车不存在'
        });
      }
      
      const cartId = carts[0].id;
      
      // 验证购物车商品是否属于用户
      const [items] = await db.execute(
        'SELECT ci.id, ci.product_id, p.stock, p.unit, p.is_bulk, p.min_order_quantity FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.cart_id = ?',
        [itemId, cartId]
      );
      
      if (items.length === 0) {
        return res.status(404).json({
          success: false,
          message: '购物车商品不存在'
        });
      }
      
      const item = items[0];
      
      // 验证库存
      if (item.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: '商品库存不足'
        });
      }
      
      // 验证最低起订量
      if (item.is_bulk && quantity < item.min_order_quantity) {
        return res.status(400).json({
          success: false,
          message: `该商品最低起订数量为${item.min_order_quantity}${item.unit}`
        });
      }
      
      // 更新数量
      await db.execute(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [quantity, itemId]
      );
      
      return res.json({
        success: true,
        message: '购物车商品已更新'
      });
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '更新购物车失败，请重试'
      });
    }
  }

  /**
   * 删除购物车商品
   */
  async removeFromCart(req, res) {
    try {
      const userId = req.userData.userId;
      const itemId = req.params.itemId;
      
      // 验证用户购物车
      const [carts] = await db.execute(
        'SELECT id FROM carts WHERE user_id = ?',
        [userId]
      );
      
      if (carts.length === 0) {
        return res.status(400).json({
          success: false,
          message: '购物车不存在'
        });
      }
      
      const cartId = carts[0].id;
      
      // 验证购物车商品是否属于用户
      const [items] = await db.execute(
        'SELECT id FROM cart_items WHERE id = ? AND cart_id = ?',
        [itemId, cartId]
      );
      
      if (items.length === 0) {
        return res.status(404).json({
          success: false,
          message: '购物车商品不存在'
        });
      }
      
      // 删除商品
      await db.execute(
        'DELETE FROM cart_items WHERE id = ?',
        [itemId]
      );
      
      return res.json({
        success: true,
        message: '商品已从购物车移除'
      });
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '移除购物车商品失败，请重试'
      });
    }
  }

  /**
   * 更新购物车商品选中状态
   */
  async updateCartItemSelected(req, res) {
    try {
      const userId = req.userData.userId;
      const { selected, items } = req.body;
      
      // 验证用户购物车
      const [carts] = await db.execute(
        'SELECT id FROM carts WHERE user_id = ?',
        [userId]
      );
      
      if (carts.length === 0) {
        return res.status(400).json({
          success: false,
          message: '购物车不存在'
        });
      }
      
      const cartId = carts[0].id;
      
      // 如果提供了items数组，则更新特定商品
      if (items && Array.isArray(items) && items.length > 0) {
        // 验证购物车商品是否属于用户
        const placeholders = items.map(() => '?').join(',');
        const [validItems] = await db.execute(
          `SELECT id FROM cart_items WHERE id IN (${placeholders}) AND cart_id = ?`,
          [...items, cartId]
        );
        
        if (validItems.length !== items.length) {
          return res.status(400).json({
            success: false,
            message: '部分商品不在购物车中'
          });
        }
        
        // 更新选中状态
        await db.execute(
          `UPDATE cart_items SET selected = ? WHERE id IN (${placeholders})`,
          [selected ? 1 : 0, ...items]
        );
      } else {
        // 更新所有商品
        await db.execute(
          'UPDATE cart_items SET selected = ? WHERE cart_id = ?',
          [selected ? 1 : 0, cartId]
        );
      }
      
      return res.json({
        success: true,
        message: '购物车商品选中状态已更新'
      });
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '更新购物车失败，请重试'
      });
    }
  }

  /**
   * 清空购物车
   */
  async clearCart(req, res) {
    try {
      const userId = req.userData.userId;
      
      // 验证用户购物车
      const [carts] = await db.execute(
        'SELECT id FROM carts WHERE user_id = ?',
        [userId]
      );
      
      if (carts.length === 0) {
        return res.status(400).json({
          success: false,
          message: '购物车不存在'
        });
      }
      
      const cartId = carts[0].id;
      
      // 清空购物车
      await db.execute(
        'DELETE FROM cart_items WHERE cart_id = ?',
        [cartId]
      );
      
      return res.json({
        success: true,
        message: '购物车已清空'
      });
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '清空购物车失败，请重试'
      });
    }
  }
}

module.exports = new CartController(); 