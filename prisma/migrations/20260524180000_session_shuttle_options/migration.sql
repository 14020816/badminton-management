-- AlterTable
ALTER TABLE "PlaySession" ADD COLUMN "shuttlePricePerBlock" INTEGER;

-- AlterTable
ALTER TABLE "SessionShare" ADD COLUMN "paysShuttleCost" BOOLEAN NOT NULL DEFAULT true;
