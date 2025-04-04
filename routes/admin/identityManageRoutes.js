const express = require('express');
const router = express.Router();
const identityManageController = require('../../controllers/admin/identityManageController');

// 获取认证申请列表
router.get('/certifications', identityManageController.getCertificationList.bind(identityManageController));

// 审核认证申请
router.put('/certifications/:certificationId/review', identityManageController.reviewCertification.bind(identityManageController));

// 获取身份统计信息
router.get('/stats', identityManageController.getIdentityStats.bind(identityManageController));

// 身份类型管理接口
router.get('/types', identityManageController.getIdentityTypes.bind(identityManageController));
router.post('/types', identityManageController.createIdentityType.bind(identityManageController));
router.put('/types/:code', identityManageController.updateIdentityType.bind(identityManageController));
router.delete('/types/:code', identityManageController.deleteIdentityType.bind(identityManageController));

module.exports = router; 