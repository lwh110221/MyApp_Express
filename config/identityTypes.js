/**
 * 身份类型配置
 */
const IdentityTypes = {
  // 基础身份
  NORMAL: {
    code: 'NORMAL',
    name: '普通用户',
    isDefault: true,
    needCertification: false
  },
  
  // 认证身份
  FARMER: {
    code: 'FARMER',
    name: '农户',
    needCertification: true,
    validityDays: 365,
    certificationRequirements: {
      requiredFields: ['idCard'],
      description: '需要提供身份证'
    }
  },
  
  DEALER: {
    code: 'DEALER',
    name: '经销商',
    needCertification: true,
    validityDays: 365,
    certificationRequirements: {
      requiredFields: ['businessLicense', 'foodPermit'],
      description: '需要提供营业执照和食品经营许可证'
    }
  },
  
  EXPERT: {
    code: 'EXPERT',
    name: '农业专家',
    needCertification: true,
    validityDays: 365,
    certificationRequirements: {
      requiredFields: ['professionalCert', 'workProof'],
      description: '需要提供职称证书和工作证明'
    }
  }
};

// 获取所有需要认证的身份类型
const getCertificationRequiredTypes = () => {
  return Object.values(IdentityTypes).filter(type => type.needCertification);
};

// 获取身份类型信息
const getIdentityTypeInfo = (code) => {
  return IdentityTypes[code] || null;
};

// 验证身份类型是否有效
const isValidIdentityType = (code) => {
  return !!IdentityTypes[code];
};

module.exports = {
  IdentityTypes,
  getCertificationRequiredTypes,
  getIdentityTypeInfo,
  isValidIdentityType
}; 