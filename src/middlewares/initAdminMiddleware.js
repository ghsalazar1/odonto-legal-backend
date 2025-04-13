const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async () => {
  try {

    // Verifica e cria roles
    await checkRoles();
    // Verifica e cria admin
    await checkAdmin();

    // Verifica e cria teste user // será apagado na versão final
    await checkTest();

  } catch (err) {
    console.error('Erro no middleware de inicialização:', err);
    throw err; // rethrow para o catch lá no server.js capturar
  }
};

async function checkAdmin() {
      // Verifica e cria admin
    const adminExists = await prisma.user.findFirst({
      where: { email: 'administrador@odontolegal.com.br' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('administrador', 10);
      await prisma.user.create({
        data: {
          email: 'administrador@odontolegal.com.br',
          name: 'Administrador',
          password: hashedPassword,
          forgotPasswordToken: "",
          roleId: "1",
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

async function checkTest(){
  // Verifica e cria test
  const testExist = await prisma.user.findFirst({
    where: { email: 'teste@teste.com.br' },
  });

  if (!testExist) {
    const hashedPassword = await bcrypt.hash('teste', 10);
    await prisma.user.create({
      data: {
        email: 'teste@teste.com.br',
        name: 'João do Teste',
        password: hashedPassword,
        forgotPasswordToken: "",
        roleId: "2",
      },
    });
    console.log('Usuário administrador criado');
  }
}