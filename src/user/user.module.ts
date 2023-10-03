import { Module, forwardRef } from "@nestjs/common";
import { UserResolver } from "./resolvers/user/user.resolver";
import { UserService } from "./services/user/user.service";
import { PrismaModule } from "prisma/prisma.module";
import { JwtService } from "@nestjs/jwt";
import { ChatModule } from "src/chat/chat.module";
import { WebSocketModule } from "src/gateways/websocket.module";

@Module({
  imports: [forwardRef(() => WebSocketModule), PrismaModule, forwardRef(() => ChatModule)],
  providers: [UserService, UserResolver, JwtService],
  exports: [UserService]
})

export class UserModule {}
