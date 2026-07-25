# Plano de Redesign Completo & UX do CuidaPet

Este plano estabelece a reformulação estética e funcional de **todas as telas do sistema CuidaPet**, utilizando o mapeamento estrutural do **Graphify** (`graphify-out/GRAPH_REPORT.md`) e as referências visuais do Pinterest como diretriz de design system (estética moderna, limpa, com cards arredondados, fotos reais de pets com cuidadores, cores harmoniosas e navegação sem atrito).

---

## 🔍 Mapeamento Arquitetural (Via Graphify Analysis)

A análise do grafo de dependências do CuidaPet revelou os seguintes nós centrais e módulos de integração:

- **App Shell & Layout Global**: `PublicLayout.tsx` (Nó de integração de rotas e navegação) e `useAuthStore` (Nó Central de estado global com 29 conexões).
- **Public Marketplace**: `LandingPage.tsx`, `SearchPage.tsx`, `PetsitterDetailPage.tsx`, `CardPetsitter.tsx`, `PetsitterFilters.tsx`, `CityAutocomplete.tsx`.
- **Fluxo do Petsitter**: `PetsitterDashboardPage.tsx`, `PetsitterBookingsPage.tsx`, `PetsitterProfilePage.tsx`.
- **Fluxo do Tutor**: `BookingsPage.tsx`, `PetsPage.tsx`, `MatchWizard.tsx`, `MatchResults.tsx`.
- **Comunicação & Feedback**: `ChatPage.tsx`, `ChatThread.tsx`, `bookingService`, `locationService`, `chatService`.

---

## 🖼️ Elementos Fotográficos e Imagens (Conforme Referências do Pinterest)

> [!IMPORTANT]
> **Imagens de Pets com Cuidadores na Hero Section e Telas**:
> Conforme presente nos layouts de referência enviados:
> 1. **Hero Section (Página Inicial)**: Imagem principal em destaque mostrando **pets com cuidadores/petsitters felizes** (passeando, brincando ou cuidando de cães e gatos em ambiente acolhedor).
> 2. **Cards de Serviços e Categorias**: Fotos ilustrativas de alta qualidade para cada tipo de serviço (Hospedagem, Passeios, Pet Sitting e Adestramento).
> 3. **Painel de Autenticação (Login/Cadastro - Estilo Petshree)**: Coluna lateral com imagem temática de carinho e cuidado pet + tutor/petsitter.
> 4. **Avatares e Perfil do Petsitter**: Molduras circulares/arredondadas com bordas de destaque e badges de verificação.

---

## 🎨 Diretrizes de Design & Mapeamento de Referências

1. **Autenticação (Login / Cadastro)** — *Inspiração: [Petshree UI - Link 3](https://pin.it/3jgqGb3Hj)*:
   - Layout elegante em 2 colunas no desktop (ou card central flutuante em glassmorphism no mobile).
   - Coluna lateral com fotografia temática de pet com cuidador.
   - Formulários limpos com campos arredondados (`rounded-xl`), botões com estado hover radiante e ilustrações/fotos amigáveis.
   - Alternador fluido entre Tutor e Petsitter com feedback visual instantâneo.

2. **Página Inicial & Marketplace Público (`LandingPage`, `SearchPage`, `PetsitterDetail`)** — *Inspiração: [Links 1 e 2](https://pin.it/4N10RUKvE)*:
   - **Landing Page**: Hero Section impactante com fotografia principal de cuidador interagindo com pets, busca rápida no topo, estatísticas sociais, badges de confiança, passos interativos "Como funciona" e depoimentos em carrossel/grid.
   - **Search Page**: Cards de Petsitters com fotos em destaque, badge de nota/avaliação, valor por hora/diária, tags de especialidade (Cães, Gatos, Medicamentos) e botão direto de "Agendar".

3. **Painel do Petsitter & Fluxo de Aceite/Localização** — *Inspiração: [Links 1 e 2](https://pin.it/2Y7Bgdq8w)*:
   - **Painel Unificado de Ações Rápidas**: Eliminando a navegação excessiva entre telas (`PetsitterDashboardPage.tsx`).
   - **Card de Solicitações Pendentes (Top Priority Widget)**: Ações diretas de 1-Clique `[Aceitar]` e `[Recusar]`.
   - **Widget de Serviço em Andamento**: Botão em destaque `[📍 Enviar Localização Atual]` integrado ao `locationService`.
   - **Toggle de Disponibilidade**: Chave no topo ("Disponível para novos agendamentos").

4. **Header Global & Central de Notificações em Tempo Real**:
   - Ícone de sino (`Bell`) com badge vermelho de pendências no Header (`PublicLayout.tsx`).
   - Popover interativo (`NotificationDropdown.tsx`) consultando `bookingService` e `chatService`.

---

## 🚀 User Review Required

> [!IMPORTANT]
> **Consolidação das Telas do Petsitter**:
> Propõe-se transformar a Dashboard do Petsitter no seu hub principal com abas/widgets em uma única visualização fluida, reduzindo a necessidade de alternar constantemente entre `/dashboard/petsitter` e `/dashboard/petsitter/agendamentos`.

> [!TIP]
> **Design System Global (`index.css` & Tailwind)**:
> Vamos expandir as variáveis de cor (suaves, tons pastel HSL, primária vibrante, bordas sutis) e tokens de sombra para garantir coerência visual em 100% das páginas do site.

---

## ❓ Open Questions

1. **Modo Dark / Claro**: O design system será focado no **Modo Claro Premium** (como nas referências), ou deseja suporte a alternador de tema Escuro no Header?
2. **Prioridade de Execução**: Podemos começar aplicando o redesenho na **Landing Page + Login/Cadastro + Central de Notificações**, para depois aplicar nos **Dashboards de Petsitter e Tutor**?

---

## 🛠️ Alterações Propostas por Componente

---

### Componente 1: Sistema de Design & Header Global (`Frontend/src`)

#### [MODIFY] `index.css`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/index.css)
- Adicionar tokens de design system (sombras `shadow-card`, gradientes suaves, animações de fade/slide e suporte a badges HSL).

#### [MODIFY] `PublicLayout.tsx`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/layouts/PublicLayout.tsx)
- Redesenhar a barra de navegação superior (Navbar) com logo destacada, links limpos e o componente `NotificationDropdown` (sino de alertas).

#### [NEW] `NotificationDropdown.tsx`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/components/notifications/NotificationDropdown.tsx)
- Dropdown no Header com lista de notificações ativas (novos agendamentos, check-in enviado pelo petsitter, chat).

---

### Componente 2: Telas de Autenticação (`Frontend/src/pages/auth`)

#### [MODIFY] `LoginPage.tsx`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/pages/auth/LoginPage.tsx)
- Redesenhar a tela de Login inspirada no **Petshree (Link 3)**: layout limpo de 2 colunas com fotografia lateral de petsitter com pet, campos estilizados com ícones e botão de acesso direto.

#### [MODIFY] `RegisterPage.tsx`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/pages/auth/RegisterPage.tsx)
- Ajustar a tela de cadastro com a mesma estética limpa do Login e seletor fluido do perfil (Tutor ou Petsitter).

---

### Componente 3: Página Inicial & Busca (`Frontend/src/pages/public`)

#### [MODIFY] `LandingPage.tsx`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/pages/public/LandingPage.tsx)
- Reformular a Página Inicial inspirada nas referências do Pinterest:
  - Hero section vibrante com fotografia principal de cuidador com pet e barra de busca rápida ("Onde seu pet precisa de cuidado?").
  - Grade de categorias de serviços com fotos ilustrativas de pets para cada serviço (Hospedagem, Passeios, Pet Sitting, Adestramento).
  - Seção "Por que escolher o CuidaPet?" com cards minimalistas e ícones modernos.

#### [MODIFY] `SearchPage.tsx`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/pages/public/SearchPage.tsx)
- Reformular os cards de Petsitters da busca com notas em destaque, fotos de perfil em molduras arredondadas e badges de verificação (`CardPetsitter.tsx`).

---

### Componente 4: Painéis de Petsitter e Tutor (`Frontend/src/pages/petsitter` & `pages/tutor`)

#### [MODIFY] `PetsitterDashboardPage.tsx`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/pages/petsitter/PetsitterDashboardPage.tsx)
- **Hub Único do Petsitter**:
  - Banner de disponibilidade ON/OFF.
  - Widget de Solicitações Pendentes com botões de 1-Clique `[Aceitar]` e `[Recusar]`.
  - Widget de Serviço em Andamento com botão `[📍 Enviar Localização Agora]`.
  - Cards de métricas visuais (Receita, Avaliação, Concluídos) no topo.

#### [MODIFY] `PetsitterBookingsPage.tsx`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/pages/petsitter/PetsitterBookingsPage.tsx)
- Redesenho da lista de agendamentos para hierarquia visual de leitura rápida e filtros limpos por aba.

#### [MODIFY] `BookingsPage.tsx`(file:///c:/Users/Miguel/Downloads/CuidaPet-main/CuidaPet-main/Frontend/src/pages/account/BookingsPage.tsx)
- Painel de Agendamentos do Tutor com linha do tempo do serviço e alerta visual de check-ins de localização.

---

## 🧪 Plano de Verificação

1. **Verificação de Layout & Estética**:
   - Abrir no navegador e testar a Landing Page, Login, Cadastro, Busca e Dashboards em desktop (1440px) e mobile (375px).
2. **Verificação dos Fluxos Rápidos**:
   - Testar o aceite de agendamento em 1 clique na dashboard do petsitter.
   - Testar o envio de localização no botão de ação rápida do serviço ativo.
   - Testar a central de notificações abrindo o popover no Header.
