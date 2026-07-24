-- Liga RLS deny-all na tabela ChatMessage, mesma política do restante do schema (Item B).
-- REGRESSÃO: ChatMessage foi criada em 20260719160202_add_chat_and_booking_timestamps, depois
-- do Item B (20260718153617_enable_rls_deny_all), e o ENABLE ficou esquecido — confirmado via
-- Supabase Advisors (rls_disabled_in_public, nível ERROR) e reproduzido: a anon key lia as 15
-- linhas existentes via REST (`GET /rest/v1/ChatMessage` retornava Content-Range real, contra
-- Content-Range: */0 em tabelas com RLS, ex. Booking) — mensagens de chat entre tutor e
-- petsitter, dado privado, expostas por completo a qualquer portador da anon key.
-- Sem CREATE POLICY: o backend (Prisma, role postgres, bypassrls=true) não é afetado; a
-- anon/authenticated key do Supabase deixa de conseguir ler ou escrever nenhuma mensagem.
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
