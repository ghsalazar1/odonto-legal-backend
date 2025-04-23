const ReportService = require('../services/ReportService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

module.exports = {
  async generateDossier(req, res) {
    try {
      const caseId = req.params.id;
      const userId = req.user?.id;

      const result = await ReportService.generateAndStoreDossier(caseId, userId);

      if (!result.success) {
        return errorResponse(res, result.message || 'Erro ao gerar dossiê.', 400);
      }

      return successResponse(res, 'Dossiê gerado com sucesso.', 201, result.data);
    } catch (err) {
      console.error('[ERRO AO GERAR DOSSIÊ]', err);
      return errorResponse(res, 'Erro interno ao gerar dossiê.', 500);
    }
  }
};
