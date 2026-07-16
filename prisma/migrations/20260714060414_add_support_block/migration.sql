-- CreateTable
CREATE TABLE "SupportBlock" (
    "id" SERIAL NOT NULL,
    "page" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SupportBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportBlock_page_idx" ON "SupportBlock"("page");
