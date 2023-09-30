import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { UserService } from "src/user/services/user/user.service";
import { UserStatusGateway } from "./../../../gateways/user-status.gateway";
import {
  CreateDirectChannelOutput,
  SendMessageOutput,
  UpdateMessageOutput,
  createDirectChannelInput,
} from "./dtos/channel-dtos";

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
      const user1 = await this.userService.findById(input.userId1);
      const user2 = await this.userService.findById(input.userId2);
      await this.prisma.channel.create({
        data: {
          name: `Direct-${user1.name}-${user2.name}`,
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
      await this.prisma.message.update({
        where: { id: messageId },
        data: { content: newContent },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
