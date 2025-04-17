const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const PaginatedUserResponseDTO = require('../dto/paginated-users-response-dto');

async function listUsers(query) {
  const { page = 1, limit = 10, search = '' } = query;

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { role: { description: { contains: search, mode: 'insensitive' } } },
      ],
    },
    include: { role: true },
    skip: (page - 1) * limit,
    take: parseInt(limit),
  });

  const total = await prisma.user.count();

  return new PaginatedUserResponseDTO({
    data: users,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
  });
}

async function createUser({ name, email, password, roleId }) {
  // Verifica se o e-mail já está em uso
  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    const error = new Error('E-mail já cadastrado');
    error.statusCode = 409;
    throw error;
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Cria o novo usuário
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      roleId,
    },
    include: {
      role: true,
    },
  });

  delete user.password; 
  return user;
}


module.exports = {
  listUsers,
  createUser
};