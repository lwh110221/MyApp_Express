const BaseController = require('../baseController');
const identityService = require('../../services/identityService');
const ResponseUtil = require('../../utils/responseUtil');

class IdentityManageController extends BaseController {
  /**
   * 获取所有认证申请列表
   */
  async getCertificationList(req, res) {
    try {
      const { page = 1, pageSize = 10, status } = req.query;
      const result = await identityService.getCertificationList(
        parseInt(page),
        parseInt(pageSize),
        status ? parseInt(status) : undefined
      );

      ResponseUtil.page(res, result);
    } catch (error) {
      console.error('获取认证申请列表错误:', error);
      ResponseUtil.error(res, '获取认证申请列表失败', 500);
    }
  }

  /**
   * 审核身份认证申请
   */
  async reviewCertification(req, res) {
    try {
      if (!req.admin || !req.admin.id) {
        console.error('审核认证申请错误: 管理员未认证');
        return ResponseUtil.error(res, '管理员未认证', 401);
      }

      // 检查是否有审核权限
      if (!req.admin.permissions.includes('identity:certification:review')) {
        return ResponseUtil.error(res, '没有审核权限', 403);
      }

      const reviewerId = req.admin.id;
      const { certificationId } = req.params;
      const { approved, comment } = req.body;

      const result = await identityService.reviewCertification(
        certificationId,
        reviewerId,
        approved,
        comment
      );

      ResponseUtil.success(res, result, approved ? '认证申请已通过' : '认证申请已拒绝');
    } catch (error) {
      console.error('审核认证申请错误:', error);
      ResponseUtil.error(res, '处理认证申请失败', 500);
    }
  }

  /**
   * 获取用户身份统计信息
   */
  async getIdentityStats(req, res) {
    try {
      // 检查是否有查看统计权限
      if (!req.admin.permissions.includes('identity:stats')) {
        return ResponseUtil.error(res, '没有查看统计权限', 403);
      }

      const stats = await identityService.getIdentityStats();
      ResponseUtil.success(res, stats, '获取身份统计信息成功');
    } catch (error) {
      console.error('获取身份统计信息错误:', error);
      ResponseUtil.error(res, '获取身份统计信息失败', 500);
    }
  }
}

module.exports = new IdentityManageController(); 