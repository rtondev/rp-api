-- AlterEnum: replace GUIA with ADMIN
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('TURISTA', 'GESTOR', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE "role"::text
    WHEN 'GUIA' THEN 'GESTOR'::"UserRole"
    ELSE "role"::text::"UserRole"
  END
);
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'TURISTA';
DROP TYPE "UserRole_old";

-- PlaceSignal responses
ALTER TABLE "PlaceSignal" ADD COLUMN "response" TEXT;
ALTER TABLE "PlaceSignal" ADD COLUMN "respondedAt" TIMESTAMP(3);
ALTER TABLE "PlaceSignal" ADD COLUMN "respondedById" TEXT;
ALTER TABLE "PlaceSignal" ADD CONSTRAINT "PlaceSignal_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EventSignal responses
ALTER TABLE "EventSignal" ADD COLUMN "response" TEXT;
ALTER TABLE "EventSignal" ADD COLUMN "respondedAt" TIMESTAMP(3);
ALTER TABLE "EventSignal" ADD COLUMN "respondedById" TEXT;
ALTER TABLE "EventSignal" ADD CONSTRAINT "EventSignal_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Favorite
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Favorite_userId_placeId_key" ON "Favorite"("userId", "placeId");
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Itinerary
CREATE TABLE "Itinerary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ItineraryStop
CREATE TABLE "ItineraryStop" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItineraryStop_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ItineraryStop_itineraryId_sortOrder_key" ON "ItineraryStop"("itineraryId", "sortOrder");
ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
