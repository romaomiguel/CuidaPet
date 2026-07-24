-- Liga RLS deny-all na tabela RefreshToken, mesma política do restante do schema (Item B):
-- sem CREATE POLICY, o backend (Prisma, role postgres, bypassrls=true) não é afetado; a
-- anon/authenticated key do Supabase deixa de conseguir ler ou escrever tokenHash de ninguém.
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
