const UserService = require('../services/UserService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

exports.list = async (req, res) => {
  try {
    const { query, page, limit } = req.query;
    const result = await UserService.listUsers({ query, page, limit });
    return successResponse(res, 'Usuários listados com sucesso', 200, result.data, result.meta);
    
    res.json(result);
  } catch (err) {
    console.error('Erro no controller:', err);
    return errorResponse(res, 'Erro ao listar usuários', 500, err);
  }
};