-- AlterTable
ALTER TABLE "User" ADD COLUMN     "entitlement" TEXT,
ADD COLUMN     "entitlementExpiresAt" TIMESTAMP(3),
ADD COLUMN     "entitlementProductIdentifier" TEXT;
