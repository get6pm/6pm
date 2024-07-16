-- CreateTable
CREATE TABLE "CachedGptResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,

    CONSTRAINT "CachedGptResponse_pkey" PRIMARY KEY ("id")
);
