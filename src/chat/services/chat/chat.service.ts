import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { UserService } from "src/user/services/user/user.service";
import { UserStatusGateway } from './../../../gateways/user-status.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly userGateway: UserStatusGateway
  ) {}

  async createDirectChannel(userId: string, userId2: string): Promise<void> {
    const user1 = await this.userService.findById(userId);
    const user2 = await this.userService.findById(userId2);
    await this.prisma.channel.create({
      data: {
        name: `Direct-${user1.name}-${user2.name}`,
        isPrivate: true,
        isDirectMessage: true,
        members: {
          connect: [{ id: userId }, { id: userId2 }],
        },
      },
    });
    this.userGateway.notifyDirectChannelCreated(userId, userId2);
  }
}
