const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthService = require('../services/AuthService');
require('dotenv').config();

module.exports = {
  async login(req, res) {
    const { email, password } = req.body;
    const errMsg = "Login e/ou senha incorretos.";

    const user = await AuthService.getUserByEmail(email);
    if (!user || !user.isActive) return res.status(401).json({ error: errMsg });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: errMsg });

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    res.json({ accessToken });
  },

  async refreshToken(req, res) {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'Refresh token não fornecido' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await AuthService.getUserById(decoded.id);

      if (!user || !user.isActive) {
        return res.status(403).json({ error: 'Usuário não encontrado ou inativo' });
      }

      const newAccessToken = AuthService.generateAccessToken(user);
      res.json({ accessToken: newAccessToken });
    } catch (err) {
      return res.status(403).json({ error: 'Refresh token inválido ou expirado' });
    }
  },

  async logout(req, res) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,        // use true em produção com HTTPS
      sameSite: 'lax'
    });
  
    return res.status(200).json({ message: 'Logout realizado com sucesso.' });
  }
};
