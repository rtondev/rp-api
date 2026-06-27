-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "registrationLatitude" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "registrationLongitude" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "registrationMeta" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AlterTable
ALTER TABLE "PlaceSignal" ADD COLUMN "submitLatitude" DOUBLE PRECISION;
ALTER TABLE "PlaceSignal" ADD COLUMN "submitLongitude" DOUBLE PRECISION;
ALTER TABLE "PlaceSignal" ADD COLUMN "submitMeta" JSONB;

-- AlterTable
ALTER TABLE "EventSignal" ADD COLUMN "submitLatitude" DOUBLE PRECISION;
ALTER TABLE "EventSignal" ADD COLUMN "submitLongitude" DOUBLE PRECISION;
ALTER TABLE "EventSignal" ADD COLUMN "submitMeta" JSONB;
