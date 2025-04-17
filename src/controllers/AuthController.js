const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

require('dotenv').config();

module.exports = {

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
  }
  
};
