const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const initAdminMiddleware = require('./middlewares/initAdminMiddleware');
const setupSwagger = require('./utils/swagger');

const allowedOrigins = [
  'http://localhost:4200',
  'https://odonto-legal.netlify.app',
];

dotenv.config();

const app = express();

// -------------------------------
// 🛡️ Middlewares globais
// -------------------------------

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
// -------------------------------
// 📄 Swagger Docs
// -------------------------------
setupSwagger(app);

// -------------------------------
// 📁 Arquivos estáticos (ex: uploads)
// -------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------
// 🚀 Inicialização de admin e roles
// -------------------------------
initAdminMiddleware()
  .then(() => {
    console.log('Admin e roles carregados com sucesso.');
  })
  .catch((err) => {
    console.error('Erro ao inicializar admin/roles:', err);
  });

// -------------------------------
// 🌐 Rotas
// -------------------------------
app.get('/', (req, res) => {
  res.send('🚀 Bem-vindo à API Odonto Legal!');
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// -------------------------------
// ❓ Rota não encontrada
// -------------------------------
app.use((req, res, next) => {
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
  console.log(`✅ Servidor rodando: http://localhost:${PORT}`);
  console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
});
