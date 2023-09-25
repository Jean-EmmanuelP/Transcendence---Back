/*
  Warnings:

  - You are about to drop the column `expiresIn` on the `OAuth` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `OAuth` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OAuth" DROP COLUMN "expiresIn",
DROP COLUMN "scope";
