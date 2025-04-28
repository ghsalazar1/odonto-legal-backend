# Odonto Legal Backend

Backend da aplicação **Odonto Legal**, desenvolvido em **Node.js**, **Express** e **Prisma ORM** com integração ao **MongoDB** e **Supabase Storage**.

![Node.js](https://img.shields.io/badge/Node.js-18.x-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen) ![Prisma](https://img.shields.io/badge/Prisma-ORM-blue) ![Supabase](https://img.shields.io/badge/Supabase-Storage-lightgrey)

## 🌐 Documentação da API (Swagger)

A documentação interativa da API está disponível em:

```
http://localhost:3000/api-docs
```

## 🧠 Tecnologias Utilizadas

- Node.js + Express.js
- MongoDB (via Prisma ORM)
- Supabase Storage (armazenamento de evidências e relatórios)
- JWT para autenticação
- Swagger para documentação da API
- Multer para upload de arquivos
- Helmet, Cors, Morgan para segurança e logs

## 📂 Estrutura do Projeto

```
/prisma/schema.prisma        # Schema do Prisma ORM (MongoDB)
/src/controllers             # Controllers da aplicação
/src/services                # Serviços de negócio e integração externa
/src/dto                     # Objetos de resposta da API (DTOs)
/src/middlewares             # Middlewares de autenticação e permissão
/src/utils                   # Funções utilitárias (uploads, helpers, responses)
/server.js                   # Ponto de entrada da aplicação
/.env                        # Arquivo de variáveis de ambiente
```

## 🔧 Variáveis de Ambiente (.env)

| Variável | Descrição |
|:----------|:-----------|
| `DATABASE_URL` | URL de conexão com o MongoDB |
| `JWT_SECRET` | Segredo para assinar tokens JWT |
| `IS_PRODUCTION` | Controla se o ambiente é produção (`true`) ou desenvolvimento (`false`) |
| `SUPABASE_URL` | URL da instância Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima para operações públicas |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço para operações administrativas |
| `SUPABASE_EVIDENCE_BUCKET` | Nome do bucket para armazenar **evidências** |
| `SUPABASE_REPORT_BUCKET` | Nome do bucket para armazenar **relatórios** |
| `PORT` | Porta para o servidor Express (default: 3000) |
| `ADMIN_USER` | Email do usuário administrador inicial |
| `ADMIN_PASSWORD` | Senha do usuário administrador inicial |

### ⚡ Sobre `IS_PRODUCTION`

- `true`: Uploads feitos para o Supabase Storage.
- `false`: Uploads armazenados localmente (`/uploads/evidences` e `/uploads/reports`).

## 🚀 Como subir o Ambiente de Desenvolvimento

### 1. Clonar o Repositório

```bash
git clone <url-do-repo>
cd odonto-legal-backend
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar o .env

Exemplo:

```env
DATABASE_URL="mongodb://localhost:27017/odonto-legal"
JWT_SECRET="chave-secreta"
IS_PRODUCTION=false
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_EVIDENCE_BUCKET="evidences"
SUPABASE_REPORT_BUCKET="reports"
ADMIN_USER="admin@admin.com"
ADMIN_PASSWORD="admin123"
PORT=3000
```

### 4. Subir o MongoDB local

```bash
mongod
```

### 5. Gerar o Prisma Client

```bash
npx prisma generate
```

> *Nota:* Não precisa rodar `prisma migrate` porque está usando MongoDB.

### 6. Rodar o Servidor

Com nodemon (modo dev):

```bash
npm run dev
```

Ou diretamente:

```bash
node src/server.js
```

## 🛠️ Fluxo de Armazenamento de Arquivos

- **Dev** (`IS_PRODUCTION=false`): arquivos locais (`/uploads/evidences`, `/uploads/reports`).
- **Prod** (`IS_PRODUCTION=true`): arquivos nos buckets configurados no Supabase.

## 🔒 Autenticação e Controle de Acesso

- Proteção JWT via `authMiddleware`
- Controle de acesso Admin via `isAdminMiddleware`
- Usuários administradores iniciais gerados usando `ADMIN_USER` e `ADMIN_PASSWORD`

## 📝 Comandos rápidos

```bash
# Instalar dependências
yarn install # ou npm install

# Gerar Prisma Client
npx prisma generate

# Rodar o servidor
yarn dev # ou npm run dev
```

## 🐳 Rodar usando Docker (opcional)

### 1. MongoDB via Docker

```bash
docker run --name mongo-odonto -p 27017:27017 -d mongo
```

### 2. Configurar `.env` apontando para localhost e seguir fluxo normal.

## 📌 Observações Extras

- Documentação completa disponível via Swagger (`/api-docs`)
- Arquitetura limpa e pronta para escala
- Controle de uploads dependente de ambiente
- Controle rigoroso de segurança em rotas administrativas

---
