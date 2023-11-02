import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UserService } from "src/user/services/user/user.service";
import * as jwt from "jsonwebtoken";
import { forwardRef } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";

@WebSocketGateway()
export class UserStatusGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly prisma: PrismaService
  ) {}
  private clients = new Map<string, string>();
  private userSockets = new Map<string, string[]>();

  private async getGroupMembersSockets(groupId: string): Promise<string[]> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!channel) return [];

    const memberIds = channel.members.map((member) => member.id);
    const memberSockets: string[] = [];

    memberIds.forEach((memberId) => {
      const sockets = this.userSockets.get(memberId);
      if (sockets) {
        memberSockets.push(...sockets);
      }
    });

    return memberSockets;
  }

  handleConnection(client: Socket, ...args: any[]) {
    try {
      const token = client.handshake.query.token;
      if (typeof token === "string") {
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET
        ) as jwt.JwtPayload;
        const userId = payload.userId;
        if (userId) {
          this.clients.set(client.id, userId);
          this.userService.updateUserStatus(userId, "ONLINE");

          if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).push(client.id);
          } else {
            this.userSockets.set(userId, [client.id]);
          }
        } else {
          console.log("userId is not defined in the token payload");
          client.disconnect();
        }
      } else {
        console.log("Token is not a string");
        client.disconnect();
      }
    } catch (err) {
      console.log("This is the error from the handleConnection", err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.clients.get(client.id);
    if (userId) {
      this.userService.updateUserStatus(userId, "OFFLINE");
      this.clients.delete(client.id);

      const userSocketIds = this.userSockets.get(userId);
      if (userSocketIds) {
        const index = userSocketIds.indexOf(client.id);
        if (index > -1) {
          userSocketIds.splice(index, 1);
        }
        if (userSocketIds.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    } else {
      console.log(`userId not found for client.id:`, client.id);
    }
  }

  notifyDirectChannelCreated(userId1: string, userId2: string): void {
    const sockets1 = this.userSockets.get(userId1);
    const sockets2 = this.userSockets.get(userId2);

    if (sockets1) {
      sockets1.forEach((socketId) => {
        this.server
          .to(socketId)
          .emit("directChannelCreated", { userId1, userId2 });
      });
    }

    if (sockets2) {
      sockets2.forEach((socketId) => {
        this.server
          .to(socketId)
          .emit("directChannelCreated", { userId1, userId2 });
      });
    }
  }

  @SubscribeMessage("newMessage")
  async handleMessage(
    @MessageBody() data: { groupId: string; message: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.clients.get(client.id);
    if (!userId) {
      console.log("User ID not found for client:", client.id);
      return;
    }
    try {
      const newMessage = await this.prisma.message.create({
        data: {
          content: data.message,
          channelId: data.groupId,
          userId: userId,
        },
      });

      const groupMembersSocketIds = await this.getGroupMembersSockets(
        data.groupId
      );

      groupMembersSocketIds.forEach((socketId) => {
        this.server.to(socketId).emit("newMessage", newMessage);
      });
    } catch (error) {
      console.error("Failed to insert message in DB", error);
    }
  }
}
