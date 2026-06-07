# 🐾 CuidaPet — Frontend

Frontend da plataforma **CuidaPet**, sistema web que conecta **tutores de pets** com **petsitters**.

## 🛠️ Tecnologias Utilizadas

- **Framework:** React com Vite
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS
- **Gerenciamento de Estado:** Zustand
- **Data Fetching:** TanStack Query (React Query) e Axios
- **Formulários:** React Hook Form e Zod
- **Roteamento:** React Router DOM
- **Ícones:** Lucide React

## 🚀 Como Rodar o Projeto

### 1. Pré-requisitos
- Node.js (v18+)
- Backend rodando na porta 3000 (ver instruções na pasta `backend`)

### 2. Instalação
No terminal, entre na pasta `Frontend` e instale as dependências:
```bash
cd Frontend
npm install
```

### 3. Configuração das Variáveis de Ambiente
Crie um arquivo `.env` (ou `.env.local`) na raiz da pasta `Frontend` (onde fica o `package.json`):
```env
VITE_API_URL="http://localhost:3000"
```

### 4. Executando a Aplicação
```bash
# Modo de desenvolvimento (Live Reload)
npm run dev
```
A aplicação rodará por padrão em `http://localhost:5173`.

## 📂 Arquitetura do Projeto

```bash
src/
 ├── components/     # Componentes reutilizáveis de UI (Sidebar, cards, etc)
 ├── layouts/        # Estruturas base das páginas (AuthLayout, PublicLayout, DashboardLayout)
 ├── pages/          # Páginas (Admin, Petsitter, Tutor, Autenticação)
 ├── services/       # Integrações via Axios com as rotas do backend
 ├── store/          # Estado global do usuário via Zustand (sessão persistida)
 ├── types/          # Interfaces TypeScript globais (User, Petsitter, Booking)
 └── lib/            # Configurações de libs externas (Axios interceptors)
```

## 👑 Acesso Administrativo (Painel)
Para acessar o painel de aprovações de Petsitters e gerenciamento de usuários:
1. Certifique-se de ter rodado o script de *seed* no backend para gerar a conta Admin.
2. Acesse a tela de **Login** (`http://localhost:5173/login`) e entre com:
   - **E-mail:** `admin@cuidapet.com`
   - **Senha:** `admin123`
3. Você será redirecionado imediatamente para o **Dashboard Administrativo**.
