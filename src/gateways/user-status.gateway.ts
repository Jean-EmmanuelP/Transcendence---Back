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

  handleConnection(client: Socket, ...args: any[]) {
    const userId = client.id;
    this.userService.updateUserStatus(userId, "ONLINE");
  }

  handleDisconnect(client: Socket) {
      
  }
}
