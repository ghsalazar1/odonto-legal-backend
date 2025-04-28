const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DashboardService = {
  async getDashboardSummary() {
    try {
      const [userCount, activeCases, archivedCases, reportsCreated] = await Promise.all([
        prisma.user.count(),
        prisma.case.count({ where: { status: 'Em andamento' } }),
        prisma.case.count({ where: { status: 'Arquivado' } }),
        prisma.report.count()
      ]);

      return {
        success: true,
        data: {
          userCount,
          activeCases,
          archivedCases,
          reportsCreated
        }
      };
    } catch (error) {
      console.error('[ERRO DashboardService.getDashboardSummary]', error);
      return {
        success: false,
        message: 'Erro ao obter resumo do dashboard',
        error
      };
    }
  }
};

module.exports = DashboardService;
