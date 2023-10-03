-- CreateTable
CREATE TABLE "ChannelBan" (
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "bannedId" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "bannedBy" TEXT NOT NULL,

    CONSTRAINT "ChannelBan_pkey" PRIMARY KEY ("userId","channelId")
);

-- CreateTable
CREATE TABLE "ChannelMute" (
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "mutedId" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "mutedBy" TEXT NOT NULL,

    CONSTRAINT "ChannelMute_pkey" PRIMARY KEY ("userId","channelId")
);

-- AddForeignKey
ALTER TABLE "ChannelBan" ADD CONSTRAINT "ChannelBan_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMute" ADD CONSTRAINT "ChannelMute_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
