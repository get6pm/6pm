/*
  Warnings:

  - Made the column `contentDisposition` on table `BlobObject` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BlobObject" ALTER COLUMN "contentType" DROP NOT NULL,
ALTER COLUMN "contentDisposition" SET NOT NULL;
