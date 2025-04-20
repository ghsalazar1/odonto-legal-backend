const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const PaginatedUserResponseDTO = require('../dto/paginated-users-response-dto');

async function listUsers(query) {
  const { page = 1, limit = 10, search = '' } = query;

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
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

  const total = await prisma.user.count({ where: { isActive: true } });

  return new PaginatedUserResponseDTO({
    data: users,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
  });
}

async function getAll() {

  const users = await prisma.user.findMany({
    where: {
      isActive: true
    },
    include: { role: true },
  });

  const total = await prisma.user.count({ where: { isActive: true } });

  return new PaginatedUserResponseDTO({
    data: users,
    total,
  });
}

async function createUser({ name, email, password, roleId }) {
  // Verifica se já existe um usuário ativo com o mesmo e-mail
  const userExists = await prisma.user.findFirst({
    where: { email, isActive: true },
  });

  if (userExists) {
    const error = new Error('E-mail já cadastrado');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      roleId,
      isActive: true,
    },
    include: {
      role: true,
    },
  });

  delete user.password;
  return user;
}

async function deleteUser(id) {
  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser || !existingUser.isActive) {
    return null;
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return true;
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true }
  });

  if (!user || !user.isActive) {
    return null;
  }

  delete user.password; 
  return user;
}

async function updateUser(id, data) {
  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser || !existingUser.isActive) {
    return null;
  }

  const updatePayload = {
    name: data.name,
    email: data.email,
    roleId: data.roleId,
  };

  const email = data.email;

  if(email != existingUser.email){
    const emailExist = await prisma.user.findFirst({
      where: { email, isActive: true },
    });

    if (emailExist) {
      const error = new Error('E-mail já cadastrado');
      error.statusCode = 409;
      throw error;
    }
  }


  if (data.password) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    updatePayload.password = hashedPassword;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updatePayload,
    include: { role: true },
  });

  delete updatedUser.password;
  return updatedUser;
}


module.exports = {
  listUsers,
  createUser,
  deleteUser,
  getUserById,
  updateUser,
  getAll
};
