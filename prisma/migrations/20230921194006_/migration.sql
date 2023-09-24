/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `OAuth` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OAuth" DROP COLUMN "refreshToken";
