-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_bookingId_createdAt_idx" ON "ChatMessage"("bookingId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill pra bookings que já existiam antes desta migration (escrito à mão, não gerado
-- pelo Prisma). Sem timestamp real de quando cada transição aconteceu, usamos createdAt como
-- proxy: já é passado há muito mais de 48h, então bookings completed antigos corretamente
-- caem fora da janela de envio de chat (ficam só com histórico de leitura, se algum dia
-- ganharem mensagens retroativas — o que não é o caso aqui).
-- "acceptedAt" só é preenchido pra accepted/completed: para "cancelled" NÃO dá pra saber se o
-- cancelamento aconteceu ainda pending (chat nunca existiu) ou já accepted (chat existiu) —
-- o status antigo não guardava essa transição. Optamos por NÃO fabricar uma conversa pra
-- bookings cancelled antigos; ficam sem "acceptedAt" (sem conversa) até prova em contrário.
UPDATE "Booking" SET "acceptedAt" = "createdAt" WHERE "status" IN ('accepted', 'completed') AND "acceptedAt" IS NULL;
UPDATE "Booking" SET "completedAt" = "createdAt" WHERE "status" = 'completed' AND "completedAt" IS NULL;
