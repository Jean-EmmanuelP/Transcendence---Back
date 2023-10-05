-- DropForeignKey
ALTER TABLE "ChannelAdmin" DROP CONSTRAINT "ChannelAdmin_channelId_fkey";

-- DropForeignKey
ALTER TABLE "ChannelAdmin" DROP CONSTRAINT "ChannelAdmin_userId_fkey";

-- AddForeignKey
ALTER TABLE "ChannelAdmin" ADD CONSTRAINT "ChannelAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelAdmin" ADD CONSTRAINT "ChannelAdmin_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
