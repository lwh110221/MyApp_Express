const BaseController = require('./baseController');
const identityService = require('../services/identityService');
const { IdentityTypes, getIdentityTypeInfo } = require('../config/identityTypes');
const ResponseUtil = require('../utils/responseUtil');

class IdentityController extends BaseController {
  /**
   * 获取所有可用的身份类型
   */
  async getIdentityTypes(req, res) {
    try {
      const types = Object.values(IdentityTypes).map(type => ({
        code: type.code,
        name: type.name,
        needCertification: type.needCertification,
        requirements: type.certificationRequirements
      }));

      ResponseUtil.success(res, types, '获取身份类型列表成功');
    } catch (error) {
      console.error('获取身份类型列表错误:', error);
      ResponseUtil.error(res, '获取身份类型列表失败', 500);
    }
  }

  /**
   * 获取用户的所有身份
   */
  async getUserIdentities(req, res) {
    try {
      // 检查用户是否已认证
      if (!req.userData || !req.userData.userId) {
        console.error('获取用户身份列表错误: 用户未认证');
        return ResponseUtil.error(res, '用户未认证', 401);
      }

      console.log('正在获取用户身份, 用户ID:', req.userData.userId);
      const identities = await identityService.getUserIdentities(req.userData.userId);
      
      // 添加身份类型的详细信息
      const identitiesWithInfo = identities.map(identity => ({
        ...identity,
        typeInfo: getIdentityTypeInfo(identity.identity_type)
      }));

      ResponseUtil.success(res, identitiesWithInfo, '获取用户身份列表成功');
    } catch (error) {
      console.error('获取用户身份列表错误:', error);
      ResponseUtil.error(res, '获取用户身份列表失败', 500);
    }
  }

  /**
   * 申请身份认证
   */
  async applyCertification(req, res) {
    try {
      // 检查用户是否已认证
      if (!req.userData || !req.userData.userId) {
        console.error('申请身份认证错误: 用户未认证');
        return ResponseUtil.error(res, '用户未认证', 401);
      }

      const userId = req.userData.userId;
      const { identityType, certificationData } = req.body;

      // 验证身份类型
      const typeInfo = getIdentityTypeInfo(identityType);
      if (!typeInfo) {
        return ResponseUtil.error(res, '无效的身份类型', 400);
      }

      // 验证必需的认证资料
      const { requiredFields } = typeInfo.certificationRequirements;
      const missingFields = requiredFields.filter(
        field => !certificationData || !certificationData[field]
      );

      if (missingFields.length > 0) {
        return ResponseUtil.error(res, '认证资料不完整', 400);
      }

      const result = await identityService.applyCertification(
        userId,
        identityType,
        certificationData
      );

      ResponseUtil.success(res, result, '认证申请提交成功');
    } catch (error) {
      console.error('申请身份认证错误:', error);
      ResponseUtil.error(res, '认证申请提交失败', 500);
    }
  }
}

module.exports = new IdentityController(); 