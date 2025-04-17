const UserService = require('../services/UserService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

exports.list = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await UserService.listUsers({ search, page, limit });
    return successResponse(res, 'Usuários listados com sucesso', 200, result.data, result.meta);
  
  } catch (err) {
    console.error('Erro no controller:', err);
    return errorResponse(res, 'Erro ao listar usuários', 500, err);
  }
};


exports.create = async (req, res) => {
  try {
    const user = await UserService.createUser(req.body);
    return successResponse(res, 'Usuário criado com sucesso', 201, user);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    return errorResponse(res, err.message || 'Erro interno ao criar usuário', 400);
  }
};