import { Module } from "@nestjs/common";
import { UserResolver } from "./resolvers/user/user.resolver";
import { UserService } from "./services/user/user.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtService } from "@nestjs/jwt";

@Module({
  imports: [PrismaModule],
  providers: [UserService, UserResolver, JwtService],
  exports: [UserService]
})

export class UserModule {}
