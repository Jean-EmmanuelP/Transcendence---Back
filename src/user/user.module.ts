import { Module } from "@nestjs/common";
import { UserResolver } from "./resolvers/user/user.resolver";
import { UserService } from "./services/user/user.service";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [UserService, UserResolver],
})

export class UserModule {}
