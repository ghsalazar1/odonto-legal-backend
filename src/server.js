const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const casesRoutes = require('./routes/cases.routes');
const initAdminMiddleware = require('./middlewares/initAdminMiddleware');
const setupSwagger = require('./utils/swagger');

dotenv.config();

const app = express();

// 🔓 Origens permitidas (para CORS)
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'https://odonto-legal.netlify.app',
];

// -------------------------------
// 🛡️ Middlewares globais
// -------------------------------

app.use(express.json());
app.use(cookieParser());

// Middleware de CORS com log
app.use(cors({
  origin: (origin, callback) => {
    console.log('[CORS] Origin da requisição:', origin);

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS não permitido para a origem: ${origin}`));
  },
  credentials: true,
}));

// -------------------------------
// 📚 Documentação Swagger
// -------------------------------
setupSwagger(app);

// -------------------------------
// 📁 Arquivos estáticos
// -------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------
// 🧪 Healthcheck
// -------------------------------
app.get('/ping', (req, res) => {
  res.send('pong');
});

// -------------------------------
// 🚀 Inicialização de admin e roles
// -------------------------------
initAdminMiddleware()
  .then(() => {
    console.log('✅ Admin e roles carregados com sucesso.');
  })
  .catch((err) => {
    console.error('❌ Erro ao inicializar admin/roles:', err);
  });

// -------------------------------
// 🌐 Rotas da API
// -------------------------------
app.get('/', (req, res) => {
  res.send('🚀 Bem-vindo à API Odonto Legal!');
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/cases', casesRoutes);

// -------------------------------
// 🕵️ Rota não encontrada
// -------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// -------------------------------
// 💥 Tratamento de erros genéricos
// -------------------------------
app.use((err, req, res, next) => {
  console.error('[ERRO INTERNO]', err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// -------------------------------
// 🚀 Inicialização do servidor
// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando:na porta ${PORT}`);
  console.log(`📚 Swagger => /api-docs`);
});
