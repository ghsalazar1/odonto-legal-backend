const express = require('express');
const router = express.Router();
const userController = require('../controllers/UsersController');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Endpoints de gerenciamento de usuários (apenas Administradores)
 */

/**
 * @swagger
 * /users/selectable:
 *   get:
 *     summary: Retorna usuários disponíveis para associar a casos
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários disponíveis
 *       401:
 *         description: Não autorizado
 */
router.get('/selectable', authMiddleware, userController.getSelectable);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista usuários com paginação e filtro
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Texto para buscar por nome, email ou perfil
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       403:
 *         description: Acesso negado
 */
router.get('/', authMiddleware, isAdminMiddleware, userController.list);

/**
 * @swagger
 * /users/getAll:
 *   get:
 *     summary: Lista todos usuários sem paginação
 *     tags: [Usuários]
 *     responses:
 *       200:
 *         description: Lista de usuários completa
 *       403:
 *         description: Acesso negado
 */
router.get('/getAll', authMiddleware, isAdminMiddleware, userController.getAll);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               roleId: { type: string }
 *     responses:
 *       201:
 *         description: Usuário criado
 *       403:
 *         description: Acesso negado
 */
router.post('/', authMiddleware, isAdminMiddleware, userController.create);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Retorna um usuário pelo ID
 *     tags: [Usuários]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       403:
 *         description: Acesso negado
 */
router.get('/:id', authMiddleware, isAdminMiddleware, userController.getById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza um usuário
 *     tags: [Usuários]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               roleId: { type: string }
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       403:
 *         description: Acesso negado
 */
router.put('/:id', authMiddleware, isAdminMiddleware, userController.update);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove um usuário
 *     tags: [Usuários]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Usuário removido
 *       403:
 *         description: Acesso negado
 */
router.delete('/:id', authMiddleware, isAdminMiddleware, userController.delete);

module.exports = router;
