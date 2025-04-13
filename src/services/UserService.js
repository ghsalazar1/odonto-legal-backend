const { PrismaClient } = require('@prisma/client');
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


module.exports = {
  listUsers,
};