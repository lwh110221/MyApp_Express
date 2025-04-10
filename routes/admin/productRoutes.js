const express = require('express');
const router = express.Router();
const ProductManageController = require('../../controllers/admin/productManageController');
const { check } = require('express-validator');
const { verifyAdminToken, checkPermission } = require('../../middleware/admin/authMiddleware');

// 鉴权中间件 - 只有管理员可以访问这些接口
router.use(verifyAdminToken);

// 产品分类管理
router.get(
  '/categories',
  checkPermission('product:category:view'), 
  ProductManageController.catchAsync(ProductManageController.getAllCategories)
);

router.post(
  '/categories',
  checkPermission('product:category:create'),
  [
    check('name').trim().notEmpty().withMessage('分类名称不能为空'),
    check('name').isLength({ max: 50 }).withMessage('分类名称不能超过50个字符'),
    check('description').optional().isLength({ max: 200 }).withMessage('分类描述不能超过200个字符'),
    check('parent_id').optional().isInt().withMessage('父类别ID必须是整数'),
    check('sort_order').optional().isInt().withMessage('排序顺序必须是整数'),
    check('status').optional().isInt({ min: 0, max: 1 }).withMessage('状态值必须是0或1')
  ],
  ProductManageController.catchAsync(ProductManageController.createCategory)
);

router.delete(
  '/categories/:id',
  checkPermission('product:category:delete'),
  ProductManageController.catchAsync(ProductManageController.deleteCategory)
);

// 产品管理
router.get(
  '/products',
  checkPermission('product:view'),
  ProductManageController.catchAsync(ProductManageController.getAllProducts)
);

router.delete(
  '/products/:id',
  checkPermission('product:delete'),
  ProductManageController.catchAsync(ProductManageController.deleteProduct)
);

router.patch(
  '/products/:id/status',
  checkPermission('product:update'),
  [
    check('status').isInt({ min: 0, max: 1 }).withMessage('状态值必须是0或1')
  ],
  ProductManageController.catchAsync(ProductManageController.updateProductStatus)
);

module.exports = router; 