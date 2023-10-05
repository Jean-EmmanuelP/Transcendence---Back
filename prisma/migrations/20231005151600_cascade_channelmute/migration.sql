-- DropForeignKey
ALTER TABLE "ChannelMute" DROP CONSTRAINT "ChannelMute_channelId_fkey";

-- AddForeignKey
ALTER TABLE "ChannelMute" ADD CONSTRAINT "ChannelMute_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
