const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

module.exports = async () => {
  try {

    // Verifica e cria roles
    await checkRoles();
    // Verifica e cria admin
    await checkAdmin();


  } catch (err) {
    console.error('Erro no middleware de inicialização:', err);
    throw err; 
  }
};

async function checkAdmin() {
    // Verifica e cria admin

    const _adminUser = process.env.ADMIN_USER;
    const _adminPassword = process.env.ADMIN_PASSWORD;

    const adminExists = await prisma.user.findFirst({
      where: { email: _adminUser },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(_adminPassword, 10);
      await prisma.user.create({
        data: {
          email: _adminUser,
          name: 'Administrador',
          password: hashedPassword,
          forgotPasswordToken: "",
          roleId: "1",
          avatar: "",
          isActive: true
        },
      });
      console.log('Usuário administrador criado');
    }
}

async function checkRoles() {
    // Verifica e cria roles
    const rolesCount = await prisma.role.count();
    if (rolesCount === 0) {
      await prisma.role.createMany({
        data: [
          { id: "1", description: 'Administrador' },
          { id: "2", description: 'Perito' },
          { id: "3", description: 'Assistente' },
        ],
      });
      console.log('Roles criadas com sucesso');
    }
}