/*
  Warnings:

  - You are about to drop the column `slug` on the `Endpoint` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `Endpoint` will be added. If there are existing duplicate values, this will fail.
  - The required column `token` was added to the `Endpoint` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "Endpoint_slug_key";

-- AlterTable
ALTER TABLE "Endpoint" DROP COLUMN "slug",
ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Endpoint_token_key" ON "Endpoint"("token");
