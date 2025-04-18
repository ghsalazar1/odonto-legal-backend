const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticação
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Faz login do usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@email.com
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renova o token de acesso usando o refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Novo token gerado
 *       401:
 *         description: Refresh token não fornecido
 *       403:
 *         description: Refresh token inválido ou expirado
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Realiza logout e remove o cookie de refresh
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout realizado
 */
router.post('/logout', AuthController.logout);


module.exports = router;
