const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
require('dotenv').config();

const app = express();

app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a raiz ('/')
app.get('/', (req, res) => {
  res.send('Bem-vindo à aplicação!'); // Ou redirecione para uma página específica
});

// Rotas de autenticação
app.use('/auth', authRoutes);

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

