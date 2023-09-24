import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { User } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/services/user/user.service";
import { ConfigService } from "@nestjs/config";
import { RegisterDto } from "src/auth/dto/register.input";
import * as bcrypt from "bcrypt";
import { LoginDto } from "src/auth/dto/login.input";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly userService: UserService
  ) {}
  //typer pour google et 42
  async OauthLogin(req, oauthService: "google" | "42") {
    if (!req.user) {
      return `No user from ${oauthService}`;
    }

    // eviter les let sans les definir
    let user;

    // const user = oauthService === "google" ? this.OauthLoginGoogle(...) : this.OauthLogin42(...)

    if (oauthService === "google") {
      const { email, firstName, lastName, picture, accessToken } = req.user;
      const avatar = picture || "/src/common/images/avatar_default.gif";
      user = await this.userService.upsertOAuthUser({
        email,
        firstName,
        lastName,
        avatar,
        accessToken,
      });
    } else {
      const {
        email,
        first_name: firstName,
        last_name: lastName,
        image,
        accessToken,
      } = req.user.apiData;
      const avatarLink = image?.link;
      if (!avatarLink) {
        throw new Error("42 User data doesn't have an image link");
      }
      user = await this.userService.upsertOAuthUser({
        email,
        firstName,
        lastName,
        avatar: avatarLink,
        accessToken,
      });
    }
    const jwtToken = this.jwtService.sign(
      { userId: user.id, email: user.email },
      { secret: process.env.JWT_SECRET }
    );

    return {
      message: "User information saved in the database",
      user: user,
      access_token: jwtToken,
    };
  }

  async register(registerDto: RegisterDto) {
    return this.userService.register(registerDto);
  }

  async validateUser(loginDto: LoginDto) {
    return this.userService.validateUser(loginDto);
  }

  async generateTwoFactorSecret(userId: string) {
    return this.userService.generateTwoFactorSecret(userId);
  }

  async verifyTwoFactorToken(userId: string, token: string) {
    return this.userService.verifyTwoFactorToken(userId, token);
  }
}
