-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_walletAccountId_fkey";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletAccountId_fkey" FOREIGN KEY ("walletAccountId") REFERENCES "UserWalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
