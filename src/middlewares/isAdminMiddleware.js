const { errorResponse } = require('../utils/responseHelper');

module.exports = function isAdminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'Administrador') {
    return errorResponse(res, 'Acesso restrito à administradores.', 403, {
      reason: 'forbidden',
      userRole: req.user?.role || null,
    });
  }

  next();
};
