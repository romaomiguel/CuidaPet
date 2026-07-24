-- Liga Row Level Security (deny-all) nas 7 tabelas do schema public.
--
-- Sem nenhuma CREATE POLICY: por padrão, com RLS ligado e zero policies, os roles
-- `anon`/`authenticated` (usados pela API REST/PostgREST do Supabase e pela anon key
-- exposta no frontend) deixam de conseguir ler ou escrever qualquer linha.
--
-- O backend (Prisma, via role `postgres`, confirmado com rolbypassrls = true) NÃO É
-- AFETADO — bypassa RLS independentemente de policies existirem ou não. Esta migration
-- não deve mudar nenhum comportamento observável da aplicação.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PetsitterProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_BookingToPet" ENABLE ROW LEVEL SECURITY;
-- IF EXISTS: no banco real a tabela existe (idempotente, sem efeito). No shadow database
-- que `prisma migrate dev` cria pra qualquer diff futuro, _prisma_migrations nunca é criada
-- automaticamente (só existe quando o Prisma controla migrations contra um banco de verdade) —
-- sem o IF EXISTS, todo `migrate dev`/`migrate diff` subsequente quebra tentando alterar uma
-- tabela que não existe nessa réplica descartável.
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
