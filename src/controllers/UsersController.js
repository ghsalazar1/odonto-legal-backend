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

exports.getAll = async (req, res) => {
  try {

    const result = await UserService.getAll();
    return successResponse(res, 'Usuários listados com sucesso', 200, result.data, result.meta);
  
  } catch (err) {
    console.error('Erro no controller:', err);
    return errorResponse(res, 'Erro ao listar usuários', 500, err);
  }
};

exports.getSelectable = async (req, res) => {
  try {
    const users = await UserService.getSelectableUsers();
    return successResponse(res, 'Usuários disponíveis retornados com sucesso', 200, users);
  } catch (error) {
    console.error('[ERRO getSelectable]', error);
    return errorResponse(res, 'Erro ao buscar usuários disponíveis', 500, error);
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

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    if (id === currentUserId) {
      return errorResponse(res, 'Você não pode excluir a si mesmo.', 403);
    }

    const deleted = await UserService.deleteUser(id);

    if (!deleted) {
      return errorResponse(res, 'Usuário não encontrado ou já inativo.', 404);
    }

    return successResponse(res, 'Usuário excluído com sucesso.', 204);
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    return errorResponse(res, 'Erro ao excluir usuário.', 500, err);
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserService.getUserById(id);

    if (!user) {
      return errorResponse(res, 'Usuário não encontrado ou inativo.', 404);
    }

    return successResponse(res, 'Usuário encontrado.', 200, user);
  } catch (err) {
    console.error('Erro ao buscar usuário por ID:', err);
    return errorResponse(res, 'Erro ao buscar usuário.', 500, err);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserService.updateUser(id, req.body);

    if (!user) {
      return errorResponse(res, 'Usuário não encontrado ou inativo.', 404);
    }

    return successResponse(res, 'Usuário atualizado com sucesso.', 200, user);
  } catch (err) {
    return errorResponse(res, err?.message ?? 'Erro ao atualizar usuário.', 500, {err});
  }
};
