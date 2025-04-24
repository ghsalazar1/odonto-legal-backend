const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Relatórios
 *   description: Endpoints relacionados a relatórios de dossiê
 */

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Lista todos os relatórios de dossiê dos casos finalizados
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de relatórios retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasError:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Relatórios retornados com sucesso
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 6627e20c3ed46d2c7a77125f
 *                       summary:
 *                         type: string
 *                       notes:
 *                         type: string
 *                       contentUrl:
 *                         type: string
 *                         example: https://xyz.supabase.co/storage/v1/object/public/dossiers/caso-abc/6627e20c3ed4-123456.pdf
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       case:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           status:
 *                             type: string
 *                           caseDate:
 *                             type: string
 *                             format: date
 *                           closedAt:
 *                             type: string
 *                             format: date
 *                           peritoPrincipal:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               avatar:
 *                                 type: string
 *                           participants:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 avatar:
 *                                   type: string
 *                       evidenceCount:
 *                         type: integer
 *                         example: 5
 *       401:
 *         description: Não autorizado
 */
router.get('/', authMiddleware, ReportController.getAll);

module.exports = router;
