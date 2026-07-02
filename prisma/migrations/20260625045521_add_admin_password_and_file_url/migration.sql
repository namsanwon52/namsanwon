/*
  Warnings:

  - You are about to drop the column `displayName` on the `File` table. All the data in the column will be lost.
  - Added the required column `url` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "displayName",
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT;
