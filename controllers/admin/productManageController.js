const db = require('../../config/database');
const BaseController = require('../baseController');
const { validationResult } = require('express-validator');

/**
 * 产品管理控制器 - 管理员接口
 */
class ProductManageController extends BaseController {
  /**
   * 获取所有产品分类
   */
  async getAllCategories(req, res) {
    try {
      const { page, limit, skip } = this.getPaginationParams(req);
      
      // 查询分类总数
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM product_categories`
      );
      
      const total = countResult[0].total;
      
      // 查询分类列表，直接在SQL中使用数字而不是参数化
      const [categories] = await db.execute(
        `SELECT id, name, description, icon, parent_id, sort_order, status,
         created_at, updated_at
         FROM product_categories 
         ORDER BY sort_order ASC, id ASC
         LIMIT ${skip}, ${limit}`
      );
      
      return this.paginate(res, categories, total, page, limit);
    } catch (error) {
      this.logError(error);
      return this.error('获取产品分类失败', 500);
    }
  }

  /**
   * 新增产品分类
   */
  async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        name, 
        description, 
        parent_id, 
        sort_order = 0, 
        status = 1 
      } = req.body;
      
      // 检查分类名称是否已存在
      const [existingCategories] = await db.execute(
        `SELECT id FROM product_categories WHERE name = ?`,
        [name]
      );
      
      if (existingCategories.length > 0) {
        return this.error('分类名称已存在', 400);
      }
      
      // 如果有父分类，检查父分类是否存在
      if (parent_id) {
        const [parentCategory] = await db.execute(
          `SELECT id FROM product_categories WHERE id = ?`,
          [parent_id]
        );
        
        if (parentCategory.length === 0) {
          return this.error('父分类不存在', 400);
        }
      }
      
      // 插入新分类，icon始终为null
      const [result] = await db.execute(
        `INSERT INTO product_categories (name, description, icon, parent_id, sort_order, status)
         VALUES (?, ?, NULL, ?, ?, ?)`,
        [name, description, parent_id || null, sort_order, status]
      );
      
      // 获取新创建的分类信息
      const [newCategory] = await db.execute(
        `SELECT id, name, description, icon, parent_id, sort_order, status,
         created_at, updated_at
         FROM product_categories 
         WHERE id = ?`,
        [result.insertId]
      );
      
      // 记录操作日志
      this.logBusiness('创建产品分类', `管理员创建了产品分类 ${name}`, {
        admin_id: req.admin.id,
        category_id: result.insertId,
        category_name: name
      });
      
      return this.success(res, newCategory[0], '分类创建成功', 201);
    } catch (error) {
      this.logError(error);
      return this.error('创建分类失败', 500);
    }
  }

  /**
   * 删除产品分类
   */
  async deleteCategory(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      
      // 检查分类是否存在
      const [category] = await connection.execute(
        `SELECT name FROM product_categories WHERE id = ?`,
        [id]
      );
      
      if (category.length === 0) {
        await connection.rollback();
        return this.error('分类不存在', 404);
      }

      // 检查该分类是否有子分类
      const [childCategories] = await connection.execute(
        `SELECT id FROM product_categories WHERE parent_id = ?`,
        [id]
      );
      
      if (childCategories.length > 0) {
        await connection.rollback();
        return this.error('该分类包含子分类，无法删除', 400);
      }
      
      // 检查该分类是否有关联的产品
      const [products] = await connection.execute(
        `SELECT id FROM products WHERE category_id = ?`,
        [id]
      );
      
      if (products.length > 0) {
        await connection.rollback();
        return this.error('该分类包含产品，无法删除', 400);
      }
      
      // 执行删除操作
      await connection.execute(
        `DELETE FROM product_categories WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      // 记录操作日志
      this.logBusiness('删除产品分类', `管理员删除了产品分类 ${category[0].name}`, {
        admin_id: req.admin.id,
        category_id: id,
        category_name: category[0].name
      });
      
      return this.success(res, null, '分类删除成功');
    } catch (error) {
      await connection.rollback();
      this.logError(error);
      return this.error('删除分类失败', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * 获取所有产品列表（分页、搜索、筛选）
   */
  async getAllProducts(req, res) {
    try {
      // 获取分页参数
      const { page, limit, skip } = this.getPaginationParams(req);
      
      // 筛选参数
      const {
        title,
        category_id,
        status,
        user_id,
        min_price,
        max_price,
        is_featured
      } = req.query;
      
      // 构建查询条件
      let whereClauseArr = [];
      let params = [];
      
      if (title) {
        whereClauseArr.push('p.title LIKE ?');
        params.push(`%${title}%`);
      }
      
      if (category_id) {
        whereClauseArr.push('p.category_id = ?');
        params.push(category_id);
      }
      
      if (status !== undefined) {
        whereClauseArr.push('p.status = ?');
        params.push(status);
      }
      
      if (user_id) {
        whereClauseArr.push('p.user_id = ?');
        params.push(user_id);
      }
      
      if (min_price) {
        whereClauseArr.push('p.price >= ?');
        params.push(min_price);
      }
      
      if (max_price) {
        whereClauseArr.push('p.price <= ?');
        params.push(max_price);
      }
      
      if (is_featured !== undefined) {
        whereClauseArr.push('p.is_featured = ?');
        params.push(is_featured);
      }
      
      const whereClause = whereClauseArr.length 
        ? `WHERE ${whereClauseArr.join(' AND ')}` 
        : '';
      
      // 查询产品总数
      const countSql = `
        SELECT COUNT(*) as total 
        FROM products p
        ${whereClause}
      `;
      
      const [countResult] = await db.execute(countSql, params);
      const total = countResult[0].total;
      
      // 查询产品列表
      const productsSql = `
        SELECT p.*, pc.name as category_name, u.username as user_name
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        LEFT JOIN users u ON p.user_id = u.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ${skip}, ${limit}
      `;
      
      const [products] = await db.execute(productsSql, params);
      
      return this.paginate(res, products, total, page, limit);
    } catch (error) {
      this.logError(error);
      return this.error('获取产品列表失败', 500);
    }
  }
  
  /**
   * 删除产品
   */
  async deleteProduct(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      
      // 检查产品是否存在
      const [product] = await connection.execute(
        `SELECT p.title, p.user_id, u.username
         FROM products p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = ?`,
        [id]
      );
      
      if (product.length === 0) {
        await connection.rollback();
        return this.error('产品不存在', 404);
      }
      
      // 检查产品是否存在于购物车或订单中
      const [cartItems] = await connection.execute(
        `SELECT id FROM cart_items WHERE product_id = ?`,
        [id]
      );
      
      const [orderItems] = await connection.execute(
        `SELECT id FROM order_items WHERE product_id = ?`,
        [id]
      );
      
      // 删除购物车中的产品
      if (cartItems.length > 0) {
        await connection.execute(
          `DELETE FROM cart_items WHERE product_id = ?`,
          [id]
        );
      }
      
      // 如果产品已在订单中，提示无法删除或将其标记为删除状态
      if (orderItems.length > 0) {
        await connection.execute(
          `UPDATE products SET status = 2 WHERE id = ?`,  // 假设 status=2 表示已删除
          [id]
        );
      } else {
        // 直接删除产品
        await connection.execute(
          `DELETE FROM products WHERE id = ?`,
          [id]
        );
      }
      
      await connection.commit();
      
      // 记录操作日志
      const productInfo = product[0];
      this.logBusiness('删除产品', `管理员删除了产品 ${productInfo.title}`, {
        admin_id: req.admin.id,
        product_id: id,
        product_title: productInfo.title,
        product_owner: productInfo.username,
        product_owner_id: productInfo.user_id
      });
      
      return this.success(res, null, orderItems.length > 0 ? '产品已被标记为删除' : '产品删除成功');
    } catch (error) {
      await connection.rollback();
      this.logError(error);
      return this.error('删除产品失败', 500);
    } finally {
      connection.release();
    }
  }
  
  /**
   * 更新产品状态（上架/下架）
   */
  async updateProductStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (status === undefined || ![0, 1].includes(Number(status))) {
        return this.error('无效的状态值，必须为 0(下架) 或 1(上架)', 400);
      }
      
      // 检查产品是否存在
      const [product] = await db.execute(
        `SELECT title, status FROM products WHERE id = ?`,
        [id]
      );
      
      if (product.length === 0) {
        return this.error('产品不存在', 404);
      }
      
      // 如果状态相同，无需更新
      if (Number(product[0].status) === Number(status)) {
        return this.success(res, null, '产品状态未变更');
      }
      
      // 更新产品状态
      await db.execute(
        `UPDATE products SET status = ? WHERE id = ?`,
        [status, id]
      );
      
      // 记录操作日志
      const statusText = status == 1 ? '上架' : '下架';
      this.logBusiness('更新产品状态', `管理员将产品 ${product[0].title} ${statusText}`, {
        admin_id: req.admin.id,
        product_id: id,
        product_title: product[0].title,
        old_status: product[0].status,
        new_status: status
      });
      
      return this.success(res, null, `产品已${statusText}`);
    } catch (error) {
      this.logError(error);
      return this.error('更新产品状态失败', 500);
    }
  }
}

module.exports = new ProductManageController(); 