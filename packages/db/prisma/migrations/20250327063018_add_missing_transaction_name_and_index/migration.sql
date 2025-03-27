/*
  Warnings:

  - Added the required column `name` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_spaceId_idx" ON "Transaction"("spaceId");

-- CreateIndex
CREATE INDEX "Transaction_spaceId_type_idx" ON "Transaction"("spaceId", "type");

-- CreateIndex
CREATE INDEX "Transaction_spaceId_accountId_idx" ON "Transaction"("spaceId", "accountId");

-- CreateIndex
CREATE INDEX "Transaction_spaceId_categoryId_idx" ON "Transaction"("spaceId", "categoryId");

-- CreateIndex
CREATE INDEX "Transaction_spaceId_userId_idx" ON "Transaction"("spaceId", "userId");
