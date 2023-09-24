/*
  Warnings:

  - Made the column `isTwoFactorEnabled` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isTwoFactorEnabled" SET NOT NULL,
ALTER COLUMN "isTwoFactorEnabled" SET DEFAULT false;
