import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { UserService } from "./user/services/user/user.service";
import { UserModule } from "./user/user.module";
import { PrismaService } from "../prisma/services/prisma/prisma.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthService } from "./auth/services/auth/auth.service";
import { AuthModule } from "./auth/auth.module";
import { JwtService } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { TokenService } from "./token/services/token/token.service";
import { TokenRevocationMiddleware } from "./middlewares/TokenRevocationMiddleware";
import { ChatService } from './chat/services/chat/chat.service';
import { ChatResolver } from './chat/resolvers/chat/chat.resolver';
import { WebSocketModule } from "./gateways/websocket.module";
import { ChatModule } from "./chat/chat.module";
import { GameModule } from "./game/game.module";
import { GameGateway } from "./game/game.gateway";
import { GameService } from "./game/game.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: "schema.gql",
      context: ({ req }) => ({ req }),
      installSubscriptionHandlers: true,
      playground: true
    }),
    PassportModule.register({ secret: process.env.JWT_SECRET, defaultStrategy: "jwt" }),
    UserModule,
    WebSocketModule,
    PrismaModule,
    AuthModule,
    ChatModule,
    GameModule,
  ],
  providers: [
    JwtService,
    UserService,
    PrismaService,
    AuthService,
    TokenService,
    ChatService,
    ChatResolver,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenRevocationMiddleware).forRoutes("/auth/test");
  }
}
