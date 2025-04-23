const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Relatórios
 *   description: Geração e gerenciamento de relatórios periciais
 */

/**
 * @swagger
 * /reports/{id}/generate-dossier:
 *   post:
 *     summary: Gera o dossiê PDF de um caso finalizado e armazena no Supabase
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caso para o qual o dossiê será gerado
 *     responses:
 *       200:
 *         description: Dossiê gerado com sucesso
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
 *                   example: Dossiê gerado com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     signedUrl:
 *                       type: string
 *                       example: https://seubucket.supabase.co/storage/v1/object/sign/dossiers/caso-001.pdf?token=abc
 *       400:
 *         description: Requisição inválida
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Caso não encontrado
 *       500:
 *         description: Erro interno no servidor
 */

router.post('/:id/generate-dossier', authMiddleware, ReportController.generateDossier);

module.exports = router;