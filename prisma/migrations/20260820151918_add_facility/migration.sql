-- CreateTable
CREATE TABLE "FacilityFloor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityFloor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityRoom" (
    "id" SERIAL NOT NULL,
    "floorId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacilityRoom_floorId_idx" ON "FacilityRoom"("floorId");

-- AddForeignKey
ALTER TABLE "FacilityRoom" ADD CONSTRAINT "FacilityRoom_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "FacilityFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

