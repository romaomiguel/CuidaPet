-- Migration de BASELINE (sincronização de histórico) --------------------------------------
--
-- Este arquivo documenta as mudanças de schema que já foram aplicadas ao banco real via
-- `prisma db push` (fora do controle de migrations) entre 2026-05-18 (migration
-- "20260518155005_init") e hoje. O banco JÁ ESTÁ neste estado.
--
-- Esta migration já foi marcada como aplicada via `prisma migrate resolve --applied` —
-- portanto NUNCA roda contra o banco real. Os comandos abaixo (incluindo os DROP) só são
-- executados pelo *shadow database* descartável que `prisma migrate dev` cria e apaga
-- sozinho para validar consistência do histórico — nunca tocam dados reais.

-- ── Enum Role: valor "admin" ────────────────────────────────────────────────────────────
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'admin';

-- ── User: coluna isActive ───────────────────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- ── PetsitterProfile: colunas adicionadas após o init ───────────────────────────────────
ALTER TABLE "PetsitterProfile" ADD COLUMN IF NOT EXISTS "scheduleConfig" JSONB;
ALTER TABLE "PetsitterProfile" ADD COLUMN IF NOT EXISTS "pricingConfig" JSONB;
ALTER TABLE "PetsitterProfile" ADD COLUMN IF NOT EXISTS "capacityPerDay" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PetsitterProfile" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "PetsitterProfile" ADD COLUMN IF NOT EXISTS "identityProof" TEXT;
ALTER TABLE "PetsitterProfile" ADD COLUMN IF NOT EXISTS "addressProof" TEXT;
ALTER TABLE "PetsitterProfile" ADD COLUMN IF NOT EXISTS "acceptedSpecies" "PetSpecies"[];

-- Coluna morta, removida do schema real em algum ponto (via db push) antes de virar migration.
ALTER TABLE "PetsitterProfile" DROP COLUMN IF EXISTS "availability";

-- ── Booking: relacionamento com Pet migrou de 1:N (petId) para N:N (_BookingToPet) ──────
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_petId_fkey";
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "petId";

-- ── _BookingToPet: tabela de junção N:N Booking<->Pet ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "_BookingToPet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_BookingToPet_AB_pkey') THEN
    ALTER TABLE "_BookingToPet" ADD CONSTRAINT "_BookingToPet_AB_pkey" PRIMARY KEY ("A", "B");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "_BookingToPet_B_index" ON "_BookingToPet"("B");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_BookingToPet_A_fkey') THEN
    ALTER TABLE "_BookingToPet" ADD CONSTRAINT "_BookingToPet_A_fkey"
      FOREIGN KEY ("A") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_BookingToPet_B_fkey') THEN
    ALTER TABLE "_BookingToPet" ADD CONSTRAINT "_BookingToPet_B_fkey"
      FOREIGN KEY ("B") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── Review: índice único que faltava na migration original ─────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "Review_bookingId_tutorId_key" ON "Review"("bookingId", "tutorId");
