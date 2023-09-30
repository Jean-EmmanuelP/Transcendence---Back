import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { UserService } from "src/user/services/user/user.service";
import { UserStatusGateway } from "./../../../gateways/user-status.gateway";
import {
  ChannelOutputDTO,
  CreateDirectChannelOutput,
  DeleteMessageOutput,
  GetMessageOutput,
  SendMessageOutput,
  UpdateMessageOutput,
  createDirectChannelInput,
} from "./dtos/channel-dtos";
import { MessageModel } from "./models/message.model";
import { ChannelModel } from "./models/channel.model";

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly userGateway: UserStatusGateway
  ) {}
  async createDirectChannel(
    input: createDirectChannelInput
  ): Promise<CreateDirectChannelOutput> {
    try {
      const user2 = await this.userService.findById(input.userId2);
      await this.prisma.channel.create({
        data: {
          name: `${user2.name}`,
          isPrivate: true,
          isDirectMessage: true,
          members: {
            connect: [{ id: input.userId1 }, { id: input.userId2 }],
          },
        },
      });
      this.userGateway.notifyDirectChannelCreated(input.userId1, input.userId2);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendMessage(
    channelId: string,
    userId: string,
    content: string
  ): Promise<SendMessageOutput> {
    try {
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
        return { success: false, error: "Message not found" };
      }

      if (existingMessage.userId !== userId) {
        return {
          success: false,
          error: "You do not have permission to edit this message",
        };
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

  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<DeleteMessageOutput> {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!existingMessage) {
        return { success: false, error: "Message not found" };
      }

      if (existingMessage.userId !== userId) {
        return {
          success: false,
          error: "You do not have permission to edit this message",
        };
      }
      await this.prisma.message.delete({ where: { id: messageId } });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMessages(channelId: string): Promise<MessageModel[] | undefined[]> {
    try {
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
          })),
      }));
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
