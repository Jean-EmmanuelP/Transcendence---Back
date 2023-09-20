import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { UserService } from "./user/services/user/user.service";
import { UserModule } from "./user/user.module";
import { PrismaService } from "./prisma/services/prisma/prisma.service";
import { PrismaModule } from './prisma/prisma.module';
import { AuthController } from './auth/controllers/auth/auth.controller';
import { AuthService } from './auth/services/auth/auth.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: "schema.gql",
      installSubscriptionHandlers: true,
    }),
    UserModule,
    PrismaModule,
    AuthModule
  ],
  providers: [UserService, PrismaService, PrismaService, AuthService],
  controllers: [AuthController],
})
export class AppModule {}
