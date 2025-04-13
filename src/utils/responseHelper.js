exports.successResponse = (res, message, status = 200, data = {}, meta = {}) => {
    return res.status(200).json({
      success: false,
      message,
      data,
      meta,
    });
  };
  
  exports.errorResponse = (res, message, status = 500, error = {}) => {
    return res.status(status).json({
      hasError: true,
      message,
      error,
    });
  };