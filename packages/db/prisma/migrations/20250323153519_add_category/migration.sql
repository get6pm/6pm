/*
  Warnings:

  - A unique constraint covering the columns `[spaceId,userId]` on the table `SpaceMembership` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "SpendingCategory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "spaceId" TEXT NOT NULL,
    "groupId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#ccc',
    "icon" TEXT NOT NULL,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SpendingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpendingCategoryGroup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "spaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#ccc',

    CONSTRAINT "SpendingCategoryGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpendingBudget" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "spaceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpendingBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpendingBudget_categoryId_key" ON "SpendingBudget"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SpendingBudget_spaceId_categoryId_key" ON "SpendingBudget"("spaceId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceMembership_spaceId_userId_key" ON "SpaceMembership"("spaceId", "userId");

-- AddForeignKey
ALTER TABLE "SpendingCategory" ADD CONSTRAINT "SpendingCategory_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingCategory" ADD CONSTRAINT "SpendingCategory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SpendingCategoryGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingCategoryGroup" ADD CONSTRAINT "SpendingCategoryGroup_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingBudget" ADD CONSTRAINT "SpendingBudget_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingBudget" ADD CONSTRAINT "SpendingBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SpendingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
