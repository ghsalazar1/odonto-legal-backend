const CasesService = require('../services/CasesService');
const { validateCaseCreation, validateCaseEdit } = require('../utils/caseValidations');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const CasesController = {
  async create(req, res) {

    try {
      const validator = await validateCaseCreation(req);
      if (!validator.isValid) {
        return errorResponse(res, validator?.message ?? 'Erro ao tentar criar um novo caso', 400, { message: validator?.message });
      }

      const response = await CasesService.createCase(req);
      if(response.success){
        return successResponse(res, 'Caso criado com sucesso', 201, response.data)
      }
      else{
        errorResponse(res, response.message ?? 'Não foi possível criar o caso.', 400, response)
      }
    } catch (err) {
      const _message = err?.message ?? 'Erro interno no servidor';
      return errorResponse(res, _message, 500, { message: _message });
    }
  },
  async list(req, res) {
    try {
      const { page = 1, limit = 6, search = '' } = req.query;
      const result = await CasesService.list(Number(page), Number(limit), search);
      return successResponse(res, 'Casos listados com sucesso', 200, result.data, result.meta);
    } catch (error) {
      console.error('Erro ao listar casos:', error);
      return errorResponse(res, 'Erro ao listar os casos', 500, error);
    }
  },
  async remove(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await CasesService.deleteCase(id, userId);

      if (!result.success) {
        if (result.reason === 'not_found') {
          return errorResponse(res, 'Caso não encontrado', 404);
        }

        if (result.reason === 'unauthorized') {
          return errorResponse(res, 'Apenas o perito principal pode excluir este caso.', 403);
        }

        return errorResponse(res, 'Erro ao excluir caso', 500);
      }

      return successResponse(res, 'Caso excluído com sucesso');
    } catch (error) {
      console.error('[ERRO AO DELETAR CASO]', error);
      return errorResponse(res, 'Erro interno ao excluir o caso');
    }
  },
  async update(req, res) {
    try {
      const caseId = req.params.id;
      const userId = req.user?.id;
  
      const validator = await validateCaseEdit(req);
      if (!validator.isValid) {
        return errorResponse(res, validator.message || 'Dados inválidos para edição.', 400);
      }
  
      const result = await CasesService.updateCase(req, caseId, userId);
  
      if (!result.success) {
        if (result.reason === 'not_found') return errorResponse(res, 'Caso não encontrado', 404);
        if (result.reason === 'status_locked') return errorResponse(res, 'Somente casos em andamento podem ser editados.', 400);
        if (result.reason === 'unauthorized') return errorResponse(res, 'Somente o perito principal e os participantes podem editar o caso.', 403);
        return errorResponse(res, 'Erro ao editar o caso.', 500);
      }
  
      return successResponse(res, 'Caso atualizado com sucesso');
    } catch (error) {
      console.error('[ERRO AO EDITAR CASO]', error);
      return errorResponse(res, 'Erro interno ao editar o caso');
    }
  },
  async getById(req, res) {
    try {
      const { id } = req.params;
      const caseData = await CasesService.getById(id);
      return successResponse(res, 'Caso encontrado com sucesso', 200, caseData);
    } catch (error) {
      console.error('[ERRO AO BUSCAR CASO POR ID]', error);
      return errorResponse(res, error.message || 'Erro ao buscar caso', 500);
    }
  },
  async finalize(req, res) {
    try {
      const { id } = req.params;
      const { summary, notes } = req.body;
      const userId = req.user?.id;
  
      if (!summary || !notes) {
        return errorResponse(res, 'Resumo e notas são obrigatórios.', 400);
      }
  
      const result = await CasesService.finalizeCase(id, userId, { summary, notes });
  
      if (!result.success) {
        const status = result.reason === 'not_found' ? 404 : 400;
        return errorResponse(res, result.message, status);
      }
  
      return successResponse(res, 'Caso finalizado e dossiê gerado com sucesso.', 200, result.data);
    } catch (error) {
      console.error('[ERRO AO FINALIZAR CASO]', error);
      return errorResponse(res, 'Erro interno ao finalizar o caso.', 500);
    }
  },
  async archive(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;
  
      const result = await CasesService.archiveCase(id, userId, reason);
  
      if (!result.success) {
        if (result.reason === 'not_found') return errorResponse(res, 'Caso não encontrado', 404);
        if (result.reason === 'already_finalized') return errorResponse(res, 'Caso já está finalizado ou arquivado.', 400);
        if (result.reason === 'unauthorized') return errorResponse(res, 'Somente o perito principal pode arquivar.', 403);
        return errorResponse(res, 'Erro ao arquivar caso.', 500);
      }
  
      return successResponse(res, 'Caso arquivado com sucesso');
    } catch (error) {
      console.error('[ERRO AO ARQUIVAR CASO]', error);
      return errorResponse(res, 'Erro interno ao arquivar o caso');
    }
  }

  
};

module.exports = CasesController;
