-- AlterTable
ALTER TABLE "PetsitterProfile" ADD COLUMN     "offersLocationSharing" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LocationCheckIn" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationCheckIn_bookingId_createdAt_idx" ON "LocationCheckIn"("bookingId", "createdAt");

-- AddForeignKey
ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS (deny-all, sem CREATE POLICY) — mesmo padrão de todas as outras tabelas
-- do schema (ver 20260718153617_enable_rls_deny_all e 20260721011815_enable_rls_chat_message).
-- O backend (Prisma, role postgres, bypassrls=true) não é afetado; fecha o acesso da
-- anon/authenticated key usada pela API REST/PostgREST do Supabase.
ALTER TABLE "LocationCheckIn" ENABLE ROW LEVEL SECURITY;
