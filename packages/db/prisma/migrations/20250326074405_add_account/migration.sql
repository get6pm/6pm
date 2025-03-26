-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH_MANUAL', 'DEBIT_MANUAL', 'CREDIT_MANUAL');

-- AlterTable
ALTER TABLE "SpendingCategoryGroup" ALTER COLUMN "color" SET DEFAULT 'gray';

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "spaceId" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "lastDigits" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditLimit" DOUBLE PRECISION,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
