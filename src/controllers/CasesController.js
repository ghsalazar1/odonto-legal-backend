const CasesService = require('../services/CasesService');
const { validateCaseCreation } = require('../utils/caseValidations');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const CasesController = {
  async create(req, res) {

    try {
      const validator = await validateCaseCreation(req);
      if (!validator.isValid) {
        return errorResponse(res, validator?.message ?? 'Erro ao tentar criar um novo caso', 400, { message: validator?.message });
      }

      const caseData = await CasesService.createCase(req);
      return successResponse(res, 'Caso criado com sucesso', 201, caseData)
    } catch (err) {
      const _message = err?.message ?? 'Erro interno no servidor';
      return errorResponse(res, _message, 500, { message: _message });
    }
  }
};

module.exports = CasesController;
