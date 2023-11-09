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
import { FriendModel } from "src/user/models/user.model";

@WebSocketGateway({ cors: true })
export class UserStatusGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly prisma: PrismaService
  ) { }
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

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      // console.log("-------------SOCKET--------------");
      const token = client.handshake.query.token;
      // console.log(token);
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
          //Get all friend socket id and emit to each of them
          const friends: FriendModel[] =
            await this.userService.getAllFriendOfUser(userId);
          for (let i = 0; i < friends.length; i++) {
            if (this.userSockets.has(friends[i].id)) {
              const cliendIds = this.userSockets.get(friends[i].id);
              for (let d = 0; d < cliendIds.length; d++)
                this.server.to(cliendIds[d]).emit("updateChat");
            }
          }
          // friends.forEach(element => {
          // 	if (this.userSockets.has(element.id))
          // 	{
          // 		this.userSockets[element.id].forEach((sockId: string) => {
          // 			this.server.to(sockId).emit("updateChat");
          // 		})
          // 	}
          // });
        } else {
          // console.log("userId is not defined in the token payload");
          client.disconnect();
        }
      } else {
        // console.log("Token is not a string");
        client.disconnect();
      }
    } catch (err) {
      // console.log("This is the error from the handleConnection", err);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.clients.get(client.id);
    if (userId) {
      // console.log("SOCKET_DISCONNECT");
      this.clients.delete(client.id);
      this.userService.updateUserStatus(userId, "OFFLINE");
      const friends: FriendModel[] =
        await this.userService.getAllFriendOfUser(userId);
      // console.log("Friends:", friends);
      for (let i = 0; i < friends.length; i++) {
        if (this.userSockets.has(friends[i].id)) {
          const cliendIds = this.userSockets.get(friends[i].id);
          for (let d = 0; d < cliendIds.length; d++)
            this.server.to(cliendIds[d]).emit("updateChat");
        }
      }

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
      // console.log(`userId not found for client.id:`, client.id);
    }
  }

  async notifyChannel(channelId: string): Promise<void> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { ChannelMember: true },
    });
    for (let i = 0; channel && channel.ChannelMember && i < channel.ChannelMember.length; i++) {
      if (this.userSockets.has(channel.ChannelMember[i].userId)) {
        const cliendIds = this.userSockets.get(channel.ChannelMember[i].userId);
        for (let d = 0; d < cliendIds.length; d++)
          this.server.to(cliendIds[d]).emit("updateChat");
      }
    }
  }

  notifyUser(userId: string): void {
    if (this.userSockets.has(userId)) {
      const cliendIds = this.userSockets.get(userId);
      for (let d = 0; d < cliendIds.length; d++)
        this.server.to(cliendIds[d]).emit("updateChat");
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
      // console.log("User ID not found for client:", client.id);
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

