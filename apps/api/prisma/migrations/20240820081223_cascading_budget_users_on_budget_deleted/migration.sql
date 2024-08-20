-- DropForeignKey
ALTER TABLE "BudgetUser" DROP CONSTRAINT "BudgetUser_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "BudgetUser" DROP CONSTRAINT "BudgetUser_userId_fkey";

-- AddForeignKey
ALTER TABLE "BudgetUser" ADD CONSTRAINT "BudgetUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetUser" ADD CONSTRAINT "BudgetUser_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
