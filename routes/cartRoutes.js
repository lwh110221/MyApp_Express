const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { body, param } = require('express-validator');

// 获取购物车 - 需要认证
router.get('/', auth, cartController.getCart);

// 添加商品到购物车 - 需要认证
router.post('/items', 
  auth,
  body('product_id').isInt().withMessage('商品ID必须是整数'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('数量必须是大于0的整数'),
  validate([]),
  cartController.addToCart
);

// 更新购物车商品数量 - 需要认证
router.put('/items/:itemId', 
  auth,
  param('itemId').isInt().withMessage('购物车商品ID必须是整数'),
  body('quantity').isInt({ min: 1 }).withMessage('数量必须是大于0的整数'),
  validate([]),
  cartController.updateCartItem
);

// 删除购物车商品 - 需要认证
router.delete('/items/:itemId', 
  auth,
  param('itemId').isInt().withMessage('购物车商品ID必须是整数'),
  validate([]),
  cartController.removeFromCart
);

// 更新购物车商品选中状态 - 需要认证
router.put('/selected', 
  auth,
  body('selected').isBoolean().withMessage('选中状态必须是布尔值'),
  body('items').optional().isArray().withMessage('商品ID列表必须是数组'),
  validate([]),
  cartController.updateCartItemSelected
);

// 清空购物车 - 需要认证
router.delete('/', auth, cartController.clearCart);

module.exports = router; 