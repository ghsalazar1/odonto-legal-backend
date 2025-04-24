const ReportService = require('../services/ReportService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const ReportController = {
  /**
   * Lista todos os relatórios de dossiê dos casos finalizados
   */
  async getAll(req, res) {
    try {
      const result = await ReportService.getAll();

      if (!result.success) {
        return errorResponse(res, result.message || 'Erro ao buscar relatórios', 400);
      }

      return successResponse(res, 'Relatórios retornados com sucesso', 200, result.data);
    } catch (err) {
      console.error('[ERRO AO LISTAR RELATÓRIOS DE DOSSIÊ]', err);
      return errorResponse(res, 'Erro interno ao buscar relatórios', 500);
    }
  }
};

module.exports = ReportController;
