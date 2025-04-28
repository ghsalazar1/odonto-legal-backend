const DashboardService = require('../services/DashboardService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const DashboardController = {
  async getSummary(req, res) {
    try {
      const result = await DashboardService.getDashboardSummary();

      if (!result.success) {
        return errorResponse(res, result.message || 'Erro ao buscar dados do dashboard', 500, result.error);
      }

      return successResponse(res, 'Resumo do dashboard retornado com sucesso', 200, result.data);
    } catch (error) {
      console.error('[ERRO DashboardController.getSummary]', error);
      return errorResponse(res, 'Erro interno no servidor', 500);
    }
  }
};

module.exports = DashboardController;
