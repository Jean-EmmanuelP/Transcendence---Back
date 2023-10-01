import { Module, forwardRef } from "@nestjs/common";
import { ChatResolver } from "./resolvers/chat/chat.resolver";
import { UserService } from "src/user/services/user/user.service";
import { UserModule } from "src/user/user.module";
import { PrismaModule } from "prisma/prisma.module";
import { ChatService } from "./services/chat/chat.service";
import { JwtModule } from "@nestjs/jwt";
import { WebSocketModule } from "src/gateways/websocket.module";

@Module({
    providers: [UserService, ChatResolver, ChatService],
    imports: [forwardRef(() => UserModule), PrismaModule, JwtModule, WebSocketModule],
    exports: [ChatService]
})
export class ChatModule {}