const express = require('express');
const router = express.Router();
const CasesController = require('../controllers/CasesController');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');

const upload = multer({ limits: { fileSize: 1024 * 1536 } }); // Limite de ~1.5mbkb por arquivo

/**
 * @swagger
 * tags:
 *   name: Casos
 *   description: Endpoints para gerenciamento de casos periciais
 */

/**
 * @swagger
 * /cases:
 *   get:
 *     summary: Lista os casos periciais
 *     tags: [Casos]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Texto para filtrar por título, descrição, status ou datas
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página atual
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Quantidade de itens por página
 *     responses:
 *       200:
 *         description: Lista de casos retornada com sucesso
 */

router.get('/', authMiddleware, CasesController.list);

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


/**
 * @swagger
 * /cases/{id}:
 *   delete:
 *     summary: Remove um caso pericial pelo ID
 *     tags: [Casos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do caso
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caso excluído com sucesso
 *       404:
 *         description: Caso não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.delete('/:id', authMiddleware, CasesController.remove);

/**
 * @swagger
 * /cases/{id}:
 *   put:
 *     summary: Atualiza um caso pericial
 *     tags: [Casos]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - openedAt
 *               - caseDate
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *               openedAt: { type: string, format: date }
 *               closedAt: { type: string, format: date }
 *               caseDate: { type: string, format: date }
 *               peritoPrincipalId: { type: string }
 *               participants: { type: array, items: { type: string } }
 *               evidencesToRemove: { type: array, items: { type: string } }
 *               evidences: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       200:
 *         description: Caso atualizado com sucesso
 *       400:
 *         description: Requisição inválida
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Caso não encontrado
 */
router.put('/:id', upload.any(), authMiddleware, CasesController.update);

/**
 * @swagger
 * /cases/{id}:
 *   get:
 *     summary: Retorna os dados de um caso específico por ID
 *     tags: [Casos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do caso
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do caso retornado com sucesso
 *       404:
 *         description: Caso não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.get('/:id', authMiddleware, CasesController.getById);


module.exports = router;
