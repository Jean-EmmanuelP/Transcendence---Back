-- DropForeignKey
ALTER TABLE "ChannelBan" DROP CONSTRAINT "ChannelBan_channelId_fkey";

-- AddForeignKey
ALTER TABLE "ChannelBan" ADD CONSTRAINT "ChannelBan_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
