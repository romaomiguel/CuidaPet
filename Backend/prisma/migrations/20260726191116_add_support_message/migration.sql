-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact" TEXT,
    "question" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportMessage_resolved_createdAt_idx" ON "SupportMessage"("resolved", "createdAt");

-- Enable RLS (deny-all, sem CREATE POLICY) — mesmo padrão de todas as outras tabelas
-- do schema (ver 20260718153617_enable_rls_deny_all e 20260722001539_add_location_checkins).
ALTER TABLE "SupportMessage" ENABLE ROW LEVEL SECURITY;
