const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const productController = require('../controllers/productController');
const upload = require('../config/multer');
const { validate } = require('../middleware/validator');
const { body, query, param } = require('express-validator');

// 参数验证规则
const productValidation = [
  body('title').trim().notEmpty().withMessage('产品名称不能为空')
    .isLength({ min: 2, max: 100 }).withMessage('产品名称长度应在2-100字符之间'),
  body('description').trim().notEmpty().withMessage('产品描述不能为空'),
  body('price').isFloat({ min: 0.01 }).withMessage('价格必须是大于0的数字'),
  body('original_price').optional().isFloat({ min: 0 }).withMessage('原价必须是数字'),
  body('stock').optional().isInt({ min: 0 }).withMessage('库存必须是非负整数'),
  body('unit').trim().notEmpty().withMessage('计量单位不能为空'),
  body('category_id').isInt({ min: 1 }).withMessage('请选择产品类别'),
  body('location').optional().trim(),
  body('attributes').optional(),
  body('is_bulk').optional().isBoolean().withMessage('批量订购选项必须是布尔值'),
  body('min_order_quantity').optional().isInt({ min: 1 }).withMessage('最低起订数量必须是大于0的整数')
];

// 获取产品分类列表 - 公开接口
router.get('/categories', productController.getCategories.bind(productController));

// 获取推荐产品 - 公开接口
router.get('/featured', productController.getFeaturedProducts.bind(productController));

// 获取用户的产品列表 - 需要认证
router.get('/user', auth, productController.getUserProducts.bind(productController));

// 获取产品列表 - 公开接口
router.get('/', productController.getProducts.bind(productController));

// 获取产品详情 - 公开接口
router.get('/:id', productController.getProductById.bind(productController));

// 发布新产品 - 需要认证
router.post('/',
  auth,
  upload.array('images', 5),
  validate(productValidation),
  productController.publishProduct.bind(productController)
);

// 更新产品 - 需要认证
router.put('/:id',
  auth,
  upload.array('images', 5),
  validate(productValidation),
  productController.updateProduct.bind(productController)
);

// 删除产品 - 需要认证
router.delete('/:id', auth, productController.deleteProduct.bind(productController));

module.exports = router; 