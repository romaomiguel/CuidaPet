# Security TODO — CuidaPet

Itens da auditoria de segurança (varredura completa) que ficaram pendentes depois
de corrigir os itens 1, 2 e 3 (admin com senha fraca, rate limiting global, status
sem validação). Ordem sugerida: 4 antes de qualquer implementação de pagamento.

## [2026-07-22] Regra operacional — NUNCA usar `prisma migrate dev` neste projeto

Este projeto não tem shadow database configurado para o Prisma. Isso significa que
`prisma migrate dev` — **mesmo com `--create-only`** — não fica em modo rascunho: ele
se conecta direto no banco remoto (Supabase, projeto `CuidaPetDB`) e pode criar *e
aplicar* a migration imediatamente, sem pausa pra revisão humana.

Isso já aconteceu: uma tentativa de gerar (só gerar) a migration da feature de
localização (`LocationCheckIn` + `PetsitterProfile.offersLocationSharing`) acabou
sendo aplicada direto em produção — duas vezes, em invocações separadas do mesmo
comando. A tabela nova foi criada **sem Row Level Security**, repetindo exatamente
a regressão do Item B abaixo (tabela criada depois da migration de RLS deny-all
esquece de herdar a proteção). Detectado pelo advisor de segurança do Supabase
(`rls_disabled_in_public`) antes de qualquer dado real entrar na tabela. Revertido
por completo: `DROP TABLE`/`DROP COLUMN` aplicados manualmente, linha removida de
`_prisma_migrations`, migrations locais apagadas, `schema.prisma` restaurado —
confirmado limpo com `prisma migrate status` (9 migrations, "up to date") e
`list_tables` do Supabase (schema idêntico ao original).

**Fluxo correto daqui pra frente, pra qualquer mudança de schema:**
1. Editar `Backend/prisma/schema.prisma`.
2. Gerar o SQL de forma **somente leitura** — `prisma migrate diff` (não
   `migrate dev`) ou SQL escrito à mão a partir do diff do schema.
3. Mostrar o SQL pra revisão humana antes de qualquer aplicação.
4. Aplicar de forma explícita e única (ex.: `apply_migration` do MCP do Supabase,
   ou `psql`/`prisma db execute` manual) — nunca `migrate dev` contra este banco.
5. Toda tabela nova entra já com `ALTER TABLE "..." ENABLE ROW LEVEL SECURITY;`
   no mesmo SQL da migration que a cria (mesmo padrão do Item B/deny-all).
6. Depois de aplicar, manter `Backend/prisma/migrations/` e o histórico do Prisma
   (`_prisma_migrations` no banco) consistentes com o que foi de fato aplicado.

## [CORRIGIDO 2026-07-21] Item B — regressão: `ChatMessage` sem RLS
`ChatMessage` foi criada em `20260719160202_add_chat_and_booking_timestamps`,
depois da migration do Item B (`20260718153617_enable_rls_deny_all`), e o
`ENABLE ROW LEVEL SECURITY` ficou esquecido — a tabela nunca herdou a proteção
aplicada às outras 7 tabelas do schema na época. Confirmado via Supabase
Advisors (`rls_disabled_in_public`, nível ERROR/CRITICAL) e reproduzido: um
`GET /rest/v1/ChatMessage` com a anon key retornava `Content-Range: 0-0/15`
(as 15 linhas reais, visíveis), contra `Content-Range: */0` em tabelas com RLS
(ex. `Booking`) — mensagens de chat entre tutor e petsitter, dado privado,
expostas por completo a qualquer portador da anon key.

Corrigido pela migration `20260721011815_enable_rls_chat_message`
(`ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;`, deny-all, sem
`CREATE POLICY`, mesmo padrão do resto do schema). Verificado depois de aplicar:
anon key volta a receber `Content-Range: */0` na `ChatMessage`; o backend
(Prisma, role `postgres`, `bypassrls=true`) continua enxergando as 15 linhas
normalmente — nada quebrou. Todas as 9 tabelas do schema público confirmadas
com `rls_enabled: true` nesta data; nenhuma outra tabela criada depois do
Item B ficou pra trás (`RefreshToken` já tinha migration própria desde a
criação).

## Item 4 — `scheduleConfig`/`pricingConfig` sem validação de shape
**CRÍTICO antes de implementar pagamento.** Hoje só tem `@IsObject()` em
`Backend/src/petsitters/dto/create-petsitter-profile.dto.ts`. Um petsitter pode
setar `pricingConfig: {"hospedagem":{"type":"fixed","price":-99999}}` via
`PATCH /petsitters/me`, e isso é usado sem checagem de sinal/tipo em
`Backend/src/bookings/bookings.service.ts` (cálculo de `totalPrice`).
Correção: DTOs aninhados com `@ValidateNested()` + `@Type()` — `scheduleConfig`
restrito aos 7 dias da semana com `enabled: boolean`/`start`/`end` em `HH:MM`;
`pricingConfig` com `price: @IsNumber() @Min(0)` e `type: @IsEnum(['fixed','per_hour'])`.

## Item 5 — Paginação sem teto + `NaN` propagando pro Prisma
`Backend/src/petsitters/petsitters.controller.ts` (`findAll`, `findAllForAdmin`):
`Number(limit)`/`Number(page)` sem cap nem validação — `?limit=999999999` vai
direto pro Prisma sem teto, e `?page=abc` vira `NaN` propagando pro `skip`.
Correção: DTO de query com `@IsInt() @Min(1) @Max(100)` em vez de coerção manual.

## Item 6 — Selects não-restritivos em queries que tocam `User` (senha em memória)
`Backend/src/auth/auth.service.ts` (`validateCredentials`, `rotateRefreshToken`) e
`Backend/src/bookings/bookings.service.ts` (`cancel`, linha ~135) trazem a linha
inteira de `User` (com hash de senha) pra memória sem `select`, e remontam um
objeto seguro manualmente depois. Não vaza hoje, mas é frágil a um refactor
futuro que troque o remapeamento por um spread. Correção: usar `select` explícito
nessas queries, do jeito que `users.service.ts` já faz em 100% dos seus métodos.

## Item 7 — `identityProof`/`addressProof` crus na resposta de PATCH
`Backend/src/petsitters/petsitters.service.ts` (`update`, `updateByUserId`) não
têm `select`, então `PATCH /petsitters/me` e `PATCH /petsitters/:id` devolvem os
paths de documento pro próprio dono. Não é vazamento entre usuários, mas é
inconsistente com o design (documentos só deveriam sair via endpoint de signed
URL). Correção: adicionar `select` excluindo esses dois campos.

## Item 8 — `PATCH /petsitters/:id` sem `RolesGuard`/`@Roles`
`Backend/src/petsitters/petsitters.controller.ts` — só tem `@UseGuards(JwtAuthGuard)`,
diferente de todas as outras rotas autenticadas do arquivo. Não é explorável hoje
(o service já valida dono via `profile.userId !== requestingUserId`), mas quebra
o padrão do resto do controller. Correção: adicionar `RolesGuard` (sem `@Roles`,
já que qualquer usuário autenticado pode ser dono de um perfil) só por consistência,
ou documentar a decisão de deixar como está.

## Item 9 — `POST /petsitters` é inalcançável (limpeza de código, não corrigir agora)
Registrar um usuário com `role: 'petsitter'` já cria um `PetsitterProfile` stub
vazio automaticamente (`Backend/src/users/users.service.ts:52-66`). Como
`PetsittersService.create` rejeita com 409 quando o usuário já tem perfil
(`petsitters.service.ts:58-66`), `POST /petsitters` sempre dá 409 depois do
registro — não existe caminho em que esse endpoint funcione. Só
`PATCH /petsitters/me` é de fato usável pra completar o perfil (confirmado na
prática ao escrever o script de teste da feature de localização, que teve
que trocar `POST /petsitters` por `PATCH /petsitters/me`).
Correção: avaliar remover o endpoint morto (`POST /petsitters` no controller
+ `PetsittersService.create`), confirmando antes que nada mais chama esse
método (frontend, testes, docs). Fazer num bloco de limpeza futuro, junto com
os itens 5-8.

## Pendências de deploy (fora do escopo da auditoria de código)
- Atualizar variáveis de ambiente no Render: `DATABASE_URL`, `DIRECT_URL`,
  `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, e a senha nova do
  admin (rotacionada localmente — ver `Backend/prisma/rotate-admin-password.ts`).
- Limpar histórico do git das credenciais antigas já rotacionadas (o `Backend/.env`
  original vazado — senha do banco e `JWT_SECRET` já foram trocados; confirmar se
  o histórico do repositório remoto precisa de limpeza/squash).
- Escrever testes automatizados de auth (rotação de refresh token, detecção de
  reuso, CSRF) e de upload (magic bytes, limite de tamanho, guards de admin).
