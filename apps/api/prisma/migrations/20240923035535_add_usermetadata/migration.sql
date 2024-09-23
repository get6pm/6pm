-- CreateTable
CREATE TABLE "UserMetadata" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,

    CONSTRAINT "UserMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMetadata_userId_key" ON "UserMetadata"("userId");

-- AddForeignKey
ALTER TABLE "UserMetadata" ADD CONSTRAINT "UserMetadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
