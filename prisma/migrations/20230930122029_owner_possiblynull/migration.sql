-- DropForeignKey
ALTER TABLE "Channel" DROP CONSTRAINT "Channel_ownerId_fkey";

-- AlterTable
ALTER TABLE "Channel" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
