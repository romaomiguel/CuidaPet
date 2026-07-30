-- AlterTable
ALTER TABLE "PetsitterProfile" ADD COLUMN "hasAirConditioning" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PetsitterProfile" ADD COLUMN "homeType" TEXT;

-- AlterTable
ALTER TABLE "PetsitterProfile" ADD COLUMN "hasBackyard" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PetsitterProfile" ADD COLUMN "walkSchedule" TEXT;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN "energyLevel" TEXT;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN "socialLevel" TEXT;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN "medicalRestrictions" TEXT;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN "feedingInstructions" TEXT;
