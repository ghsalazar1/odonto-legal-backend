const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const initAdminMiddleware = require('./middlewares/initAdminMiddleware');
const setupSwagger = require('./utils/swagger');
require('dotenv').config();

const app = express();

// Middleware para converter o JSON
app.use(express.json());

app.use(cors());

// Middleware para Swagger
setupSwagger(app);

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de usuário inicial e tabela de roles
initAdminMiddleware()
.then(() => {
  console.log('Middleware de inicialização executado com sucesso.');
})
.catch((err) => {
  console.error('Erro na inicialização:', err);
});

// Rota para a raiz ('/')
app.get('/', (req, res) => {
  res.send('Bem-vindo à aplicação!'); // Ou redirecione para uma página específica
});

// Rotas de autenticação
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Middleware para tratar rotas não encontradas
app.use((req, res, next) => {
  res.status(404).send('Página não encontrada');
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

