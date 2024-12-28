/**
 * 统一的成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {string} message - 成功消息
 * @param {number} code - 状态码
 */
exports.successResponse = (res, data = null, message = '操作成功', code = 200) => {
    return res.status(code).json({
        code,
        success: true,
        message,
        data
    });
};

/**
 * 统一的错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} code - 状态码
 */
exports.errorResponse = (res, message = '操作失败', code = 500) => {
    return res.status(code).json({
        code,
        success: false,
        message
    });
};

/**
 * 统一的验证错误响应
 * @param {Object} res - Express响应对象
 * @param {Array} errors - 验证错误数组
 */
exports.validationErrorResponse = (res, errors) => {
    return res.status(400).json({
        code: 400,
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
    });
}; 