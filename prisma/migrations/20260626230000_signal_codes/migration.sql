-- AlterTable
ALTER TABLE "Place" ADD COLUMN "signalCode" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "signalCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Place_signalCode_key" ON "Place"("signalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Event_signalCode_key" ON "Event"("signalCode");
