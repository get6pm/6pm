/*
  Warnings:

  - A unique constraint covering the columns `[email,budgetId]` on the table `BudgetUserInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BudgetUserInvitation_email_budgetId_key" ON "BudgetUserInvitation"("email", "budgetId");
