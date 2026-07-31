-- AlterEnum
ALTER TYPE "ServiceType" ADD VALUE 'consulta_veterinaria';
ALTER TYPE "ServiceType" ADD VALUE 'vacinacao';
ALTER TYPE "ServiceType" ADD VALUE 'exames';
ALTER TYPE "ServiceType" ADD VALUE 'cirurgia';
ALTER TYPE "ServiceType" ADD VALUE 'internacao';
ALTER TYPE "ServiceType" ADD VALUE 'venda_produtos';
ALTER TYPE "ServiceType" ADD VALUE 'farmacia_veterinaria';

-- AlterTable
ALTER TABLE "PartnerProfile" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
