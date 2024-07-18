/*
  Warnings:

  - Added the required column `amountInVnd` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "amountInVnd" DECIMAL(65,30) NOT NULL;
