-- Rename SupportBlock -> ContentBlock (now used for about-pages too, not just support)
ALTER TABLE "SupportBlock" RENAME TO "ContentBlock";
ALTER TABLE "ContentBlock" RENAME CONSTRAINT "SupportBlock_pkey" TO "ContentBlock_pkey";
ALTER INDEX "SupportBlock_page_idx" RENAME TO "ContentBlock_page_idx";

-- AlterTable
ALTER TABLE "ContentBlock" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ContentBlock" ALTER COLUMN "updatedAt" DROP DEFAULT;
