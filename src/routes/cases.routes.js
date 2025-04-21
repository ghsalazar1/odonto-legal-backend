const express = require('express');
const router = express.Router();
const CasesController = require('../controllers/CasesController');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');

const upload = multer({ limits: { fileSize: 1024 * 900 } }); // Limite de ~900kb por arquivo

/**
 * @swagger
 * tags:
 *   name: Casos
 *   description: Endpoints para gerenciamento de casos periciais
 */

/**
 * @swagger
 * /cases:
 *   post:
 *     summary: Cria um novo caso pericial com evidências e participantes
 *     tags: [Casos]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - status
 *               - caseDate
 *               - openedAt
 *             properties:
 *               title:
 *                 type: string
 *                 example: Caso Pericial 001
 *               description:
 *                 type: string
 *                 example: Descrição completa do caso...
 *               status:
 *                 type: string
 *                 enum: [Em andamento, Finalizado, Arquivado]
 *                 example: Em andamento
 *               caseDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-04-20
 *               openedAt:
 *                 type: string
 *                 format: date
 *                 example: 2025-04-20
 *               closedAt:
 *                 type: string
 *                 format: date
 *                 example: 2025-04-25
 *               peritoPrincipalId:
 *                 type: string
 *                 example: 660f9a1c8238e41eb2fbc000
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [ "660f9a1c8238e41eb2fbc001", "660f9a1c8238e41eb2fbc002" ]
 *               evidences:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Caso criado com sucesso
 *       400:
 *         description: Requisição inválida
 *       500:
 *         description: Erro interno no servidor
 */

router.post('/', upload.any(), authMiddleware, CasesController.create);


module.exports = router;
