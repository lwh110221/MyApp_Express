/**
 * 统一的响应工具类
 */
class ResponseUtil {
  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 响应数据
   * @param {string} message - 响应消息
   * @param {number} code - 响应状态码
   */
  static success(res, data = null, message = '操作成功', code = 200) {
    const response = {
      code,
      message
    };
    
    if (data !== null) {
      response.data = data;
    }
    
    res.status(code).json(response);
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {number} code - 错误状态码
   */
  static error(res, message = '操作失败', code = 400) {
    res.status(code).json({
      code,
      message
    });
  }

  /**
   * 分页数据响应
   * @param {Object} res - Express响应对象
   * @param {Array} list - 数据列表
   * @param {number} total - 总数
   * @param {number} page - 当前页码
   * @param {number} pageSize - 每页大小
   */
  static page(res, { list, total, page, pageSize }) {
    res.status(200).json({
      code: 200,
      data: {
        list,
        pagination: {
          total,
          page,
          pageSize
        }
      },
      message: '获取成功'
    });
  }
}

module.exports = ResponseUtil; 