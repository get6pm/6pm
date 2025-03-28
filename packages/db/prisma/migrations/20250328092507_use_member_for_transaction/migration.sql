/*
  Warnings:

  - You are about to drop the column `userId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `memberId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropIndex
DROP INDEX "Transaction_spaceId_userId_idx";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "userId",
ADD COLUMN     "memberId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_spaceId_memberId_idx" ON "Transaction"("spaceId", "memberId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "SpaceMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
