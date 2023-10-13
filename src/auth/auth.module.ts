import { Module } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import jwtConfig from "./strategies/jwt/jwt.config";
import { AuthService } from "./services/auth/auth.service";
import { UserService } from "src/user/services/user/user.service";
import { PrismaModule } from "prisma/prisma.module";
import { AuthController } from "./controllers/auth/auth.controller";
import { GoogleStrategy } from "./strategies/google.strategy";
import { ConfigModule } from "@nestjs/config";
import { FortyTwoAuthStrategy } from "./strategies/42.strategy";
import { JwtStrategy } from "./strategies/jwt/jwt.strategy";
import { TokenService } from "src/token/services/token/token.service";
import { ChatModule } from "src/chat/chat.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule.register({ secret: process.env.JWT_SECRET ,defaultStrategy: "jwt" }),
    JwtModule.register(jwtConfig),
    PrismaModule,
    ChatModule
  ],
  providers: [
    JwtService,
    AuthService,
    TokenService,
    UserService,
    GoogleStrategy,
    FortyTwoAuthStrategy,
    JwtStrategy,
  ],
  exports: [AuthModule, JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
