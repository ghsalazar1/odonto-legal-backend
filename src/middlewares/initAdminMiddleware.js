const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async () => {
  try {

    // Verifica e cria roles
    await checkRoles();
    // Verifica e cria admin
    await checkAdmin();

  } catch (err) {
    console.error('Erro no middleware de inicialização:', err);
    throw err; // rethrow para o catch lá no server.js capturar
  }
};

async function checkAdmin() {
      // Verifica e cria admin
    const adminExists = await prisma.user.findFirst({
      where: { email: 'admin' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await prisma.user.create({
        data: {
          email: 'admin',
          name: 'Administrador',
          password: hashedPassword,
          forgotPasswordToken: "",
          roleId: "1",
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