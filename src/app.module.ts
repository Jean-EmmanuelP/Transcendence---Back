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
import { UserStatusGateway } from "./gateways/user-status.gateway";
import { ChatService } from './chat/services/chat/chat.service';
import { ChatResolver } from './chat/resolvers/chat/chat.resolver';

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
    PassportModule.register({ defaultStrategy: "jwt" }),
    UserModule,
    PrismaModule,
    AuthModule,
  ],
  providers: [
    JwtService,
    UserService,
    PrismaService,
    AuthService,
    TokenService,
    UserStatusGateway,
    ChatService,
    ChatResolver,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenRevocationMiddleware).forRoutes("/auth/test");
  }
}
