# 🐾 CuidaPet — Backend

Backend da plataforma **CuidaPet**, API desenvolvida em Node.js com NestJS para gerenciar tutores, petsitters, pets e agendamentos.

## 🛠️ Tecnologias Utilizadas

- **Framework:** NestJS (Node.js)
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Autenticação:** JWT (JSON Web Tokens) e bcrypt
- **Validação:** class-validator / class-transformer
- **Documentação:** Swagger (OpenAPI)

## 🚀 Como Rodar o Projeto

### 1. Pré-requisitos
- Node.js (v18+)
- PostgreSQL (ou banco configurado via URL)

### 2. Instalação
No terminal, entre na pasta `backend` e instale as dependências:
```bash
cd backend
npm install
```

### 3. Configuração das Variáveis de Ambiente
Crie um arquivo `.env` na raiz da pasta `backend` com as seguintes variáveis:
```env
DATABASE_URL="sua_url_de_conexao_postgresql"
JWT_SECRET="sua_chave_secreta_jwt"
```

### 4. Banco de Dados e Prisma
Rode as migrações para gerar as tabelas no banco de dados e sincronizar o Prisma:
```bash
npx prisma generate
npx prisma db push
```

Para semear (criar) o usuário **Admin** no banco (Necessário para acessar o painel administrativo do Frontend):
```bash
npx ts-node prisma/seed-admin.ts
```
*(As credenciais do Admin gerado serão: E-mail: `admin@cuidapet.com` | Senha: `admin123`)*

### 5. Executando a Aplicação
```bash
# Modo de desenvolvimento com live-reload
npm run start:dev

# Modo de produção
npm run build
npm run start:prod
```
O servidor rodará por padrão na porta `3000`.

## 📌 Rotas Principais (API)

### Autenticação (`/auth`)
- `POST /auth/login` — Autenticação de usuário (retorna JWT)
- `POST /auth/register` — Criação de conta (Tutor ou Petsitter)
- `GET /auth/me` — Retorna dados do usuário logado

### Usuários (`/users`)
- `GET /users` — [Admin] Lista todos os usuários
- `PATCH /users/:id/status` — [Admin] Ativa/Suspende um usuário

### Petsitters (`/petsitters`)
- `GET /petsitters` — Busca petsitters (Filtros: cidade, serviço, preço, `status=all` para admin)
- `PATCH /petsitters/:id/status` — [Admin] Aprova/Rejeita perfil de Petsitter
- `GET /petsitters/me` — Retorna os dados do Petsitter logado

### Agendamentos (`/bookings`)
- `POST /bookings` — Cria um novo agendamento
- `PATCH /bookings/:id/status` — Aceita/Recusa/Finaliza agendamento
- `GET /bookings/my-bookings` — Agendamentos do usuário logado
