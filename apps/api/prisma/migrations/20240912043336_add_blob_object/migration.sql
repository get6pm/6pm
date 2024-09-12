-- CreateTable
CREATE TABLE "BlobObject" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploadedByUserId" TEXT,
    "pathname" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentDisposition" TEXT,
    "url" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "transactionId" TEXT,

    CONSTRAINT "BlobObject_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BlobObject" ADD CONSTRAINT "BlobObject_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlobObject" ADD CONSTRAINT "BlobObject_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
