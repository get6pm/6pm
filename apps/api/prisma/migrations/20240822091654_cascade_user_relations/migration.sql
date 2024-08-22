-- DropForeignKey
ALTER TABLE "BudgetUserInvitation" DROP CONSTRAINT "BudgetUserInvitation_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "UserWalletAccount" DROP CONSTRAINT "UserWalletAccount_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserWalletAccount" ADD CONSTRAINT "UserWalletAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetUserInvitation" ADD CONSTRAINT "BudgetUserInvitation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
