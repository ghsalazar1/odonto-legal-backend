const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Endpoints para informações do dashboard
 */

/**
 * @swagger
 * /dashboards/summary:
 *   get:
 *     summary: Retorna dados agregados para o dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados retornados com sucesso
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro no servidor
 */
router.get('/summary', authMiddleware, DashboardController.getSummary);

module.exports = router;
