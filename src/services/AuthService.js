const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

module.exports = {
  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role?.description },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  },

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  },

  async getUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async getUserById(id) {
    return prisma.user.findUnique({ where: { id } });
  }
};
