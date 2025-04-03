const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { body, query, param } = require('express-validator');

// 参数验证规则
const orderValidation = [
  body('contact_name').trim().notEmpty().withMessage('联系人姓名不能为空'),
  body('contact_phone').trim().notEmpty().withMessage('联系电话不能为空')
    .matches(/^1[3-9]\d{9}$/).withMessage('请输入有效的手机号码'),
  body('address').trim().notEmpty().withMessage('收货地址不能为空'),
  body('cart_items').isArray().withMessage('购物车商品必须是数组')
    .notEmpty().withMessage('购物车商品不能为空'),
  body('note').optional().trim()
];

// 获取订单列表 - 需要认证
router.get('/', 
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('status').optional().isInt({ min: 0, max: 5 }).withMessage('订单状态必须是0-5之间的整数'),
  validate([]),
  orderController.getOrderList
);

// 获取卖家订单列表 - 需要认证
router.get('/seller', 
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('status').optional().isInt({ min: 0, max: 5 }).withMessage('订单状态必须是0-5之间的整数'),
  validate([]),
  orderController.getSellerOrders
);

// 获取卖家订单详情 - 需要认证
router.get('/seller/:orderId', 
  auth,
  param('orderId').isInt().withMessage('订单ID必须是整数'),
  validate([]),
  orderController.getSellerOrderDetail
);

// 获取订单统计 - 需要认证
router.get('/stats', auth, orderController.getOrderStats);

// 获取订单详情 - 需要认证
router.get('/:orderId', 
  auth,
  param('orderId').isInt().withMessage('订单ID必须是整数'),
  validate([]),
  orderController.getOrderDetail
);

// 创建订单 - 需要认证
router.post('/',
  auth,
  validate(orderValidation),
  orderController.createOrder
);

// 取消订单 - 需要认证
router.put('/:orderId/cancel',
  auth,
  param('orderId').isInt().withMessage('订单ID必须是整数'),
  validate([]),
  orderController.cancelOrder
);

// 确认收货 - 需要认证
router.put('/:orderId/confirm',
  auth,
  param('orderId').isInt().withMessage('订单ID必须是整数'),
  validate([]),
  orderController.confirmReceived
);

// 卖家发货 - 需要认证
router.put('/:orderId/ship',
  auth,
  param('orderId').isInt().withMessage('订单ID必须是整数'),
  body('tracking_number').trim().notEmpty().withMessage('物流单号不能为空'),
  body('shipping_company').optional().trim(),
  validate([]),
  orderController.shipOrder
);

// 支付订单 - 需要认证
router.put('/:orderId/pay',
  auth,
  param('orderId').isInt().withMessage('订单ID必须是整数'),
  body('payment_method').isInt({ min: 1, max: 3 }).withMessage('支付方式必须是1-3之间的整数'),
  validate([]),
  orderController.payOrder
);

module.exports = router; 