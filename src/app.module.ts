import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { UserService } from "./user/services/user/user.service";
import { UserModule } from "./user/user.module";
import { PrismaService } from "./prisma/services/prisma/prisma.service";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: "schema.gql",
      installSubscriptionHandlers: true,
    }),
    UserModule,
  ],
  providers: [UserService, PrismaService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
