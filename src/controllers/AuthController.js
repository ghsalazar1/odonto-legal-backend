const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

require('dotenv').config();

module.exports = {

  async register(req, res) {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.create({
        data: { email, name, password: hashedPassword },
      });

      res.status(201).json({ message: 'Usuário registrado com sucesso', user });
    } catch (err) {
      res.status(400).json({ error: 'Erro ao registrar usuário' });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;

    const errMsg = "Login e/ou senha incorretos."

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: errMsg });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: errMsg });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  },

  //Testar rota com autenticação
  async me(req, res) {

    const { userId } = req.user;
  
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true } // evita enviar senha
      });
  
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
  }
  
};
