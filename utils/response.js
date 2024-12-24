class ApiResponse {
  static success(data = null, message = '操作成功') {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  static error(message = '操作失败', code = 400, errors = null) {
    return {
      success: false,
      error: {
        message,
        code,
        errors
      },
      timestamp: new Date().toISOString()
    };
  }

  static pagination(data, total, page, limit) {
    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ApiResponse; 