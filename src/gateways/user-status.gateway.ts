import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { UserService } from "src/user/services/user/user.service";
import * as jwt from "jsonwebtoken";

@WebSocketGateway()
export class UserStatusGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService
  ) {}
  private clients = new Map<string, string>();

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
      this.userService.updateUserStatus(userId, "ONLINE");
      this.clients.delete(client.id);
    } else {
      console.log(`userId not found for client.id:`, client.id);
    }
  }
}
