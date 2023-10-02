import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { UserService } from "src/user/services/user/user.service";
import { UserStatusGateway } from "./../../../gateways/user-status.gateway";
import {
  ChannelOutputDTO,
  CreateDirectChannelOutput,
  DeleteMessageOutput,
  SendMessageOutput,
  UpdateMessageOutput,
  CreateDirectChannelInput,
  CreateChannelOutput,
  CreateChannelInput,
  OperationResult,
} from "./dtos/channel-dtos";
import { MessageModel } from "./models/message.model";
import * as bcrypt from "bcrypt";

// implement all the socket connections at the end
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly userGateway: UserStatusGateway
  ) {}
  async createDirectChannel(
    input: CreateDirectChannelInput
  ): Promise<CreateDirectChannelOutput> {
    try {
      const sender = await this.userService.findById(input.userId1);
      const receiver = await this.userService.findById(input.userId2);
    
      const channel = await this.prisma.channel.create({
        data: {
          name: `${receiver.name}-${sender.name}`,
          isPrivate: true,
          isDirectMessage: true,
        },
      });

      await this.prisma.channelMember.create({
        data: {
          userId: input.userId1,
          channelId: channel.id,
          joinedAt: new Date(),
        },
      });

      await this.prisma.channelMember.create({
        data: {
          userId: input.userId2,
          channelId: channel.id,
          joinedAt: new Date(),
        },
      });

      this.userGateway.notifyDirectChannelCreated(input.userId1, input.userId2);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // can be for private and public depends on the channelId
  async sendMessage(
    channelId: string,
    userId: string,
    content: string
  ): Promise<SendMessageOutput> {
    try {
      const userInChannel = await this.prisma.channelMember.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });
      if (!userInChannel) {
        throw new Error("User is not a member of the channel!");
      }
      // check if the user is actually a member of the channel
      // check if the user can send a message [if he is not banned, muted]
      await this.prisma.message.create({
        data: {
          content,
          userId,
          channelId,
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // broadcast to all the channelMembers
  async updateMessage(
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<UpdateMessageOutput> {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!existingMessage) {
        throw new Error("Message not found");
      }

      // add a and in the condition to check if the user is in the channel and is not muted
      if (existingMessage.userId !== userId) {
        throw new Error("You do not have permission to edit this message");
      }

      const userInChannel = await this.prisma.channelMember.findUnique({
        where: {
          userId_channelId: { userId, channelId: existingMessage.channelId },
        },
      });
      if (!userInChannel) {
        throw new Error("You are not a member of the channel");
      }

      await this.prisma.message.update({
        where: { id: messageId },
        data: { content: newContent },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // broadcast to all the channelMembers
  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<DeleteMessageOutput> {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!existingMessage) {
        throw new Error("Message not found");
      }

      // add a and in the condition to check if the user is in the channel and is not muted
      if (existingMessage.userId !== userId) {
        throw new Error("You do not have permission to edit this message");
      }

      const userInChannel = await this.prisma.channelMember.findUnique({
        where: {
          userId_channelId: { userId, channelId: existingMessage.channelId },
        },
      });
      if (!userInChannel) {
        throw new Error("You are not a member of the channel");
      }

      await this.prisma.message.delete({ where: { id: messageId } });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMessages(channelId: string): Promise<MessageModel[] | undefined[]> {
    try {
      // check with the userId if the user is in the channel and is not banned or muted
      return await this.prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: "asc" },
      });
    } catch (error) {
      return [];
    }
  }

  async getUserChannels(
    userId: string
  ): Promise<ChannelOutputDTO[] | undefined[]> {
    try {
      // check if ther user is ban
      const channels = await this.prisma.channel.findMany({
        where: { members: { some: { id: userId } } },
        include: { members: true },
      });

      return channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        members: channel.members
          .filter((member) => member.id !== userId)
          .map((member) => ({
            id: member.id,
            name: member.name,
            avatar: member.avatar,
            status: member.status,
          })),
      }));
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async createChannel(
    input: CreateChannelInput,
    userId: string
  ): Promise<CreateChannelOutput> {
    try {
      const { name, isPrivate, password } = input;
      if (isPrivate && !password) {
        throw new Error("Password is required for private channels");
      }
      const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
      // check what its sending back
      const newChannel = await this.prisma.channel.create({
        data: {
          name,
          isPrivate,
          password: hashedPassword,
          ownerId: userId,
        },
        include: {
          admins: true,
          members: true,
        },
      });

      await this.prisma.channelMember.create({
        data: {
          userId,
          channelId: newChannel.id,
          joinedAt: new Date(),
        },
      });

      await this.prisma.channelAdmin.create({
        data: {
          userId,
          channelId: newChannel.id,
        },
      });

      return { success: true, channel: newChannel };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setChannelPassword(
    channelId: string,
    password: string | null,
    userId: string
  ): Promise<OperationResult> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
      });
      if (!channel) {
        throw new Error("Channel not found");
      }
      if (channel.ownerId !== userId) {
        throw new Error("User does not have permission to set password");
      }

      const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
      if (hashedPassword) {
        await this.prisma.channel.update({
          where: { id: channelId },
          data: { password: hashedPassword },
        });
      } else {
        await this.prisma.channel.update({
          where: { id: channelId },
          data: { password: hashedPassword, isPrivate: false },
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addChannelAdmin(
    channelId: string,
    newAdminId: string,
    userId: string
  ): Promise<OperationResult> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: { admins: true, owner: true },
      });
      if (!channel) {
        throw new Error("Channel not found");
      }
      if (channel.ownerId !== userId) {
        throw new Error(
          "User does not have permission to change administrator"
        );
      }

      if (channel.admins.some((admin) => admin.userId === newAdminId)) {
        throw new Error("User is already an administrator");
      }

      await this.prisma.channelAdmin.create({
        data: {
          userId: newAdminId,
          channelId,
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // do the same logic like instagram
  async blockUser(
    blockerId: string,
    blockedId: string
  ): Promise<OperationResult> {
    try {
      if (blockerId === blockedId) {
        throw new Error("You cannot block yourself!");
      }
      const existingBlock = await this.prisma.blockedUser.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });
      if (existingBlock) {
        return { success: false, error: "User already blocked" };
      }

      await this.prisma.blockedUser.create({
        data: {
          blockerId,
          blockedId,
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // revise this method
  async unblockUser(
    blockerId: string,
    blockedId: string
  ): Promise<OperationResult> {
    try {
      const existingBlock = await this.prisma.blockedUser.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });
      if (!existingBlock) {
        return { success: false, error: "Block does not exist" };
      }

      await this.prisma.blockedUser.delete({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false, error: error.message };
    }
  }
  //
  async leaveChannel(userId: string, channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: true,
        admins: {
          select: {
            userId: true,
            assignedAt: true,
          },
        },
        ChannelMember: {
          select: {
            userId: true,
            joinedAt: true,
          },
        },
      },
    });
    if (!channel) {
      throw new Error("Channel not found");
    }
    const isMember = channel.members.some((member) => member.id === userId);
    if (!isMember) {
      throw new Error(`User is not a member of the channel`);
    }
    if (channel.ownerId === userId) {
      if (channel.admins.length > 0) {
        const oldestAdmin = channel.admins.sort(
          (a, b) => a.assignedAt.getTime() - b.assignedAt.getTime()
        )[0];
        await this.prisma.channel.update({
          where: { id: channelId },
          data: {
            ownerId: oldestAdmin.userId,
          },
        });
      } else if (channel.ChannelMember.length > 1) {
        const oldestMember = channel.ChannelMember.sort(
          (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
        )[0];
        await this.prisma.channel.update({
          where: { id: channelId },
          data: {
            ownerId: oldestMember.userId,
          },
        });
      } else {
        await this.prisma.channel.delete({
          where: { id: channelId },
        });
        return;
      }
    }

    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        members: {
          disconnect: {
            id: userId,
          },
        },
      },
    });
  }
}
