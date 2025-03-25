const db = require('../config/database');
const BaseController = require('./baseController');
const createFileCleanupMiddleware = require('../middleware/fileCleanup');
const { validationResult } = require('express-validator');

const fileCleanup = createFileCleanupMiddleware();

class ProductController extends BaseController {
  /**
   * 获取产品分类列表
   */
  async getCategories(req, res) {
    try {
      const [categories] = await db.execute(
        `SELECT id, name, description, icon, parent_id 
         FROM product_categories 
         WHERE status = 1 
         ORDER BY sort_order ASC, id ASC`
      );
      
      return this.success(res, categories);
    } catch (error) {
      this.logError(error);
      return this.error(res, '获取产品分类失败', 500);
    }
  }

  /**
   * 发布新产品
   */
  async publishProduct(req, res) {
    const connection = await db.getConnection();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // 如果有验证错误，清理上传的文件
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            await fileCleanup.cleanupSingleFile(`uploads/products/${file.filename}`);
          }
        }
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        title, 
        description, 
        price, 
        original_price, 
        stock, 
        unit, 
        category_id, 
        location, 
        attributes,
        is_bulk,
        min_order_quantity
      } = req.body;
      
      const userId = req.userData.userId;
      
      // 开始事务
      await connection.beginTransaction();

      // 处理图片
      let images = [];
      if (req.files && req.files.length > 0) {
        images = req.files.map(file => `/uploads/products/${file.filename}`);
      }

      // 安全解析attributes
      let parsedAttributes = null;
      if (attributes) {
        try {
          if (typeof attributes === 'string') {
            parsedAttributes = JSON.parse(attributes);
          } else if (typeof attributes === 'object') {
            parsedAttributes = attributes;
          }
        } catch (err) {
          await connection.rollback();
          
          // 清理已上传的图片
          if (req.files && req.files.length > 0) {
            for (const file of req.files) {
              await fileCleanup.cleanupSingleFile(`uploads/products/${file.filename}`);
            }
          }
          
          return res.status(400).json({
            success: false,
            message: '属性格式不正确，请提供有效的JSON'
          });
        }
      }
      
      const attributesStr = parsedAttributes ? JSON.stringify(parsedAttributes) : null;

      // 插入产品信息
      const [result] = await connection.execute(
        `INSERT INTO products 
        (user_id, category_id, title, description, price, original_price, stock, unit, location, images, attributes, is_bulk, min_order_quantity) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, 
          category_id, 
          title, 
          description, 
          price, 
          original_price || null, 
          stock || 0, 
          unit, 
          location || null, 
          JSON.stringify(images),
          attributesStr,
          is_bulk ? 1 : 0,
          min_order_quantity || 1
        ]
      );
      
      const productId = result.insertId;

      // 提交事务
      await connection.commit();
      
      // 获取新创建的产品信息
      const [productDetails] = await db.execute(
        `SELECT p.*, pc.name as category_name, u.username 
         FROM products p
         JOIN product_categories pc ON p.category_id = pc.id
         JOIN users u ON p.user_id = u.id
         WHERE p.id = ?`,
        [productId]
      );

      return res.status(201).json({
        success: true,
        message: '产品发布成功',
        product: productDetails[0]
      });

    } catch (error) {
      await connection.rollback();
      
      // 清理已上传的图片
      if (req.files) {
        for (const file of req.files) {
          await fileCleanup.cleanupSingleFile(`uploads/products/${file.filename}`);
        }
      }
      
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '产品发布失败，请重试'
      });
    } finally {
      connection.release();
    }
  }

  /**
   * 获取产品列表
   */
  async getProducts(req, res) {
    try {
      // 获取分页参数
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      // 获取筛选条件
      const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
      const keyword = req.query.keyword || '';
      const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
      const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;
      
      // 验证排序字段 - 只允许安全的列名
      const allowedSortFields = ['created_at', 'price', 'view_count', 'sales_count'];
      let sortBy = 'created_at'; // 默认排序字段
      if (req.query.sort_by && allowedSortFields.includes(req.query.sort_by)) {
        sortBy = req.query.sort_by;
      }
      
      const sortOrder = req.query.sort_order === 'asc' ? 'ASC' : 'DESC';
      
      // 构建查询条件
      let whereClause = 'WHERE p.status = 1';
      let params = [];
      
      if (categoryId) {
        whereClause += ' AND p.category_id = ?';
        params.push(categoryId);
      }
      
      if (keyword) {
        whereClause += ' AND (p.title LIKE ? OR p.description LIKE ?)';
        params.push(`%${keyword}%`);
        params.push(`%${keyword}%`);
      }
      
      if (minPrice !== null) {
        whereClause += ' AND p.price >= ?';
        params.push(minPrice);
      }
      
      if (maxPrice !== null) {
        whereClause += ' AND p.price <= ?';
        params.push(maxPrice);
      }
      
      // 获取产品总数
      const countSql = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
      const [countRows] = await db.query(countSql, params);
      const total = countRows[0].total;
      
      // 构建产品列表查询
      const sql = `
        SELECT 
          p.id, p.title, p.description, p.price, p.original_price, p.stock, p.unit,
          p.location, p.images, p.status, p.is_featured, p.view_count, p.sales_count,
          p.is_bulk, p.min_order_quantity,
          p.created_at, pc.name as category_name, u.username
        FROM products p
        JOIN product_categories pc ON p.category_id = pc.id
        JOIN users u ON p.user_id = u.id
        ${whereClause}
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;
      
      // 添加分页参数
      params.push(limit);
      params.push(offset);
      
      // 执行查询
      const [products] = await db.query(sql, params);
      
      // 处理JSON字段
      products.forEach(product => {
        if (product.images) {
          try {
            if (typeof product.images === 'string') {
              // 只有在确认是JSON字符串时才解析
              if (product.images.startsWith('[') || product.images.startsWith('{')) {
                product.images = JSON.parse(product.images);
              } else {
                // 如果是单个路径字符串，则包装为数组
                product.images = [product.images];
              }
            } else if (!Array.isArray(product.images)) {
              product.images = [];
            }
          } catch (e) {
            // 如果JSON解析失败，设置为空数组
            console.error(`Error parsing images for product ${product.id}:`, e);
            product.images = [];
          }
        } else {
          product.images = [];
        }
      });
      
      return this.paginate(res, products, total, page, limit);
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '获取产品列表失败，请重试'
      });
    }
  }

  /**
   * 获取产品详情
   */
  async getProductById(req, res) {
    try {
      const productId = req.params.id;
      
      // 增加浏览量
      await db.execute(
        'UPDATE products SET view_count = view_count + 1 WHERE id = ?',
        [productId]
      );
      
      // 获取产品详情
      const [products] = await db.execute(
        `SELECT 
          p.*, pc.name as category_name, 
          u.username, u.id as user_id,
          up.profile_picture
         FROM products p
         JOIN product_categories pc ON p.category_id = pc.id
         JOIN users u ON p.user_id = u.id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE p.id = ?`,
        [productId]
      );
      
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: '产品不存在'
        });
      }
      
      const product = products[0];
      
      // 处理JSON字段
      if (product.images) {
        try {
          if (typeof product.images === 'string') {
            // 只有在确认是JSON字符串时才解析
            if (product.images.startsWith('[') || product.images.startsWith('{')) {
              product.images = JSON.parse(product.images);
            } else {
              // 如果是单个路径字符串，则包装为数组
              product.images = [product.images];
            }
          } else if (!Array.isArray(product.images)) {
            product.images = [];
          }
        } catch (e) {
          // 如果JSON解析失败，设置为空数组
          console.error(`Error parsing images for product ${product.id}:`, e);
          product.images = [];
        }
      } else {
        product.images = [];
      }
      
      if (product.attributes) {
        try {
          product.attributes = JSON.parse(product.attributes);
        } catch (e) {
          // 如果JSON解析失败，设置为null
          product.attributes = null;
        }
      }
      
      // 获取相关产品
      const [relatedProducts] = await db.execute(
        `SELECT 
          p.id, p.title, p.price, p.images, p.stock, p.unit
         FROM products p
         WHERE p.category_id = ? AND p.id != ? AND p.status = 1
         ORDER BY p.is_featured DESC, p.created_at DESC
         LIMIT 6`,
        [product.category_id, productId]
      );
      
      // 处理相关产品的图片
      relatedProducts.forEach(p => {
        if (p.images) {
          try {
            if (typeof p.images === 'string') {
              // 只有在确认是JSON字符串时才解析
              if (p.images.startsWith('[') || p.images.startsWith('{')) {
                p.images = JSON.parse(p.images);
              } else {
                // 如果是单个路径字符串，则包装为数组
                p.images = [p.images];
              }
            } else if (!Array.isArray(p.images)) {
              p.images = [];
            }
          } catch (e) {
            // 如果JSON解析失败，设置为空数组
            console.error(`Error parsing images for related product ${p.id}:`, e);
            p.images = [];
          }
        } else {
          p.images = [];
        }
      });
      
      product.related = relatedProducts;
      
      return this.success(res, product);
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '获取产品详情失败，请重试'
      });
    }
  }

  /**
   * 更新产品
   */
  async updateProduct(req, res) {
    const connection = await db.getConnection();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // 如果有验证错误，清理上传的文件
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            await fileCleanup.cleanupSingleFile(`uploads/products/${file.filename}`);
          }
        }
        return res.status(400).json({ errors: errors.array() });
      }

      const productId = req.params.id;
      const userId = req.userData.userId;
      const { 
        title, 
        description, 
        price, 
        original_price, 
        stock, 
        unit, 
        category_id, 
        location, 
        attributes, 
        keepImages,
        is_bulk,
        min_order_quantity
      } = req.body;
      
      // 检查产品是否存在且属于当前用户
      const [product] = await connection.execute(
        'SELECT * FROM products WHERE id = ? AND user_id = ?',
        [productId, userId]
      );
      
      if (product.length === 0) {
        return res.status(403).json({
          success: false,
          message: '无权更新此产品'
        });
      }
      
      // 开始事务
      await connection.beginTransaction();
      
      // 处理图片
      let images = [];
      if (keepImages && Array.isArray(JSON.parse(keepImages))) {
        images = JSON.parse(keepImages);
      }
      
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
        images = [...images, ...newImages];
      }
      
      // 安全解析attributes
      let parsedAttributes = null;
      if (attributes) {
        try {
          if (typeof attributes === 'string') {
            parsedAttributes = JSON.parse(attributes);
          } else if (typeof attributes === 'object') {
            parsedAttributes = attributes;
          }
        } catch (err) {
          await connection.rollback();
          
          // 清理已上传的图片
          if (req.files && req.files.length > 0) {
            for (const file of req.files) {
              await fileCleanup.cleanupSingleFile(`uploads/products/${file.filename}`);
            }
          }
          
          return res.status(400).json({
            success: false,
            message: '属性格式不正确，请提供有效的JSON'
          });
        }
      }
      
      const attributesStr = parsedAttributes ? JSON.stringify(parsedAttributes) : null;
      
      // 更新产品信息
      await connection.execute(
        `UPDATE products 
         SET 
          title = ?,
          description = ?,
          price = ?,
          original_price = ?,
          stock = ?,
          unit = ?,
          category_id = ?,
          location = ?,
          images = ?,
          attributes = ?,
          is_bulk = ?,
          min_order_quantity = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title, 
          description, 
          price, 
          original_price || null, 
          stock || 0, 
          unit, 
          category_id, 
          location || null, 
          JSON.stringify(images),
          attributesStr,
          is_bulk ? 1 : 0,
          min_order_quantity || 1,
          productId
        ]
      );
      
      // 提交事务
      await connection.commit();
      
      // 获取更新后的产品信息
      const [updatedProduct] = await db.execute(
        `SELECT p.*, pc.name as category_name, u.username 
         FROM products p
         JOIN product_categories pc ON p.category_id = pc.id
         JOIN users u ON p.user_id = u.id
         WHERE p.id = ?`,
        [productId]
      );
      
      return res.json({
        success: true,
        message: '产品更新成功',
        product: updatedProduct[0]
      });
      
    } catch (error) {
      await connection.rollback();
      
      // 清理已上传的图片
      if (req.files) {
        for (const file of req.files) {
          await fileCleanup.cleanupSingleFile(`uploads/products/${file.filename}`);
        }
      }
      
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '产品更新失败，请重试'
      });
    } finally {
      connection.release();
    }
  }

  /**
   * 删除产品
   */
  async deleteProduct(req, res) {
    const connection = await db.getConnection();
    
    try {
      const productId = req.params.id;
      const userId = req.userData.userId;
      
      // 检查产品是否存在且属于当前用户
      const [product] = await connection.execute(
        'SELECT * FROM products WHERE id = ? AND user_id = ?',
        [productId, userId]
      );
      
      if (product.length === 0) {
        return res.status(403).json({
          success: false,
          message: '无权删除此产品'
        });
      }
      
      // 获取产品图片
      let productImages = [];
      try {
        if (product[0].images) {
          if (typeof product[0].images === 'string') {
            // 只有在确认是JSON字符串时才解析
            if (product[0].images.startsWith('[') || product[0].images.startsWith('{')) {
              productImages = JSON.parse(product[0].images);
            } else {
              // 如果不是JSON格式，则将其包装为数组
              productImages = [product[0].images];
            }
          } else if (Array.isArray(product[0].images)) {
            productImages = product[0].images;
          }
        }
      } catch (err) {
        console.error(`Error parsing images for product ${productId}:`, err);
        productImages = [];
      }
      
      // 开始事务
      await connection.beginTransaction();
      
      // 删除产品（这里采用软删除，将状态改为下架）
      await connection.execute(
        'UPDATE products SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [productId]
      );
      
      // 提交事务
      await connection.commit();
      
      return res.json({
        success: true,
        message: '产品已下架'
      });
      
    } catch (error) {
      await connection.rollback();
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '删除产品失败，请重试'
      });
    } finally {
      connection.release();
    }
  }

  /**
   * 获取推荐产品
   */
  async getFeaturedProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      
      const [products] = await db.execute(
        `SELECT 
          p.id, p.title, p.price, p.original_price, p.images, p.stock, p.unit, p.sales_count
         FROM products p
         WHERE p.status = 1 AND p.is_featured = 1
         ORDER BY p.created_at DESC
         LIMIT ?`,
        [limit]
      );
      
      // 处理图片字段
      products.forEach(product => {
        if (product.images) {
          try {
            if (typeof product.images === 'string') {
              // 只有在确认是JSON字符串时才解析
              if (product.images.startsWith('[') || product.images.startsWith('{')) {
                product.images = JSON.parse(product.images);
              } else {
                // 如果是单个路径字符串，则包装为数组
                product.images = [product.images];
              }
            } else if (!Array.isArray(product.images)) {
              product.images = [];
            }
          } catch (e) {
            // 如果JSON解析失败，设置为空数组
            console.error(`Error parsing images for featured product ${product.id}:`, e);
            product.images = [];
          }
        } else {
          product.images = [];
        }
      });
      
      return this.success(res, products);
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '获取推荐产品失败，请重试'
      });
    }
  }

  /**
   * 获取用户的产品列表
   */
  async getUserProducts(req, res) {
    try {
      // 获取分页参数
      const { page, limit, skip } = this.getPaginationParams(req);
      
      // 获取用户ID
      const userId = parseInt(req.params.userId) || req.userData.userId;
      
      // 获取产品总数
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM products WHERE user_id = ?',
        [userId]
      );
      const total = countResult[0].total;
      
      // 获取产品列表 - 修复参数类型问题
      // MySQL prepared statements 要求 LIMIT ? OFFSET ? 的参数必须是数字类型
      const limitNum = Number(limit);
      const skipNum = Number(skip);
      
      const [products] = await db.query(
        `SELECT 
          p.id, p.title, p.description, p.price, p.original_price, p.stock, p.unit,
          p.location, p.images, p.status, p.view_count, p.sales_count,
          p.created_at, pc.name as category_name
         FROM products p
         JOIN product_categories pc ON p.category_id = pc.id
         WHERE p.user_id = ?
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limitNum, skipNum]
      );
      
      // 处理图片字段
      products.forEach(product => {
        // 安全处理images字段
        if (product.images) {
          try {
            // 检查是否已经是对象
            if (typeof product.images === 'string') {
              // 只有在确认是JSON字符串时才解析
              if (product.images.startsWith('[') || product.images.startsWith('{')) {
                product.images = JSON.parse(product.images);
              } else {
                // 如果不是JSON格式，则将其包装为数组
                product.images = [product.images];
              }
            }
          } catch (err) {
            // 如果解析失败，设置为空数组
            console.error(`Error parsing images for product ${product.id}:`, err);
            product.images = [];
          }
        } else {
          product.images = [];
        }
      });
      
      return this.paginate(res, products, total, page, limit);
    } catch (error) {
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '获取用户产品列表失败，请重试'
      });
    }
  }

  /**
   * 更新产品状态（上架/下架）
   */
  async updateProductStatus(req, res) {
    const connection = await db.getConnection();
    
    try {
      const productId = req.params.id;
      const userId = req.userData.userId;
      const status = parseInt(req.query.status);
      
      // 验证状态值
      if (status !== 0 && status !== 1) {
        return res.status(400).json({
          success: false,
          message: '状态值无效，只能是0(下架)或1(上架)'
        });
      }
      
      // 检查产品是否存在且属于当前用户
      const [product] = await connection.execute(
        'SELECT * FROM products WHERE id = ? AND user_id = ?',
        [productId, userId]
      );
      
      if (product.length === 0) {
        return res.status(403).json({
          success: false,
          message: '无权更新此产品状态'
        });
      }
      
      // 开始事务
      await connection.beginTransaction();
      
      // 更新产品状态
      await connection.execute(
        'UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, productId]
      );
      
      // 提交事务
      await connection.commit();
      
      return res.json({
        success: true,
        message: status === 1 ? '产品已上架' : '产品已下架'
      });
      
    } catch (error) {
      await connection.rollback();
      this.logError(error);
      return res.status(500).json({
        success: false,
        message: '更新产品状态失败，请重试'
      });
    } finally {
      connection.release();
    }
  }
}

module.exports = new ProductController(); 