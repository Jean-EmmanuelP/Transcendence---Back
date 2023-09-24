-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTwoFactorEnabled" BOOLEAN,
ADD COLUMN     "twoFactorSecret" TEXT;
