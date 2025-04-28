const { isAdminRole } = require('../services/UserService');
const { errorResponse } = require('../utils/responseHelper');

const isAdminMiddleware = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user.roleId) {
      return errorResponse(res, 'Usuário não autenticado ou sem perfil', 401);
    }

    const isAdmin = await isAdminRole(user.roleId);

    if (!isAdmin) {
      return errorResponse(res, 'Acesso restrito a administradores', 403);
    }

    next();
  } catch (error) {
    console.error('[isAdminMiddleware] Erro:', error);
    return errorResponse(res, 'Erro ao validar perfil de administrador', 500);
  }
};

module.exports = isAdminMiddleware;
