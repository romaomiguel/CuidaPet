-- CreateTable
CREATE TABLE "ServiceSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceSuggestion_status_createdAt_idx" ON "ServiceSuggestion"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ServiceSuggestion" ADD CONSTRAINT "ServiceSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceSuggestion" ENABLE ROW LEVEL SECURITY;
