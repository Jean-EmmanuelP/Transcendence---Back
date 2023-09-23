import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/services/prisma/prisma.service";
import { User } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/services/user/user.service";
import { ConfigService } from "@nestjs/config";
import { RegisterDto } from "src/auth/dto/register.input";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  async OauthLogin(req, oauthService: "google" | "42") {
    if (!req.user) {
      return `No user from ${oauthService}`;
    }

    let user;

    if (oauthService === "google") {
      const { email, firstName, lastName, picture, accessToken } = req.user;
      const avatar = picture || null;
      user = await this.userService.upsertOAuthUser({
        email,
        firstName,
        lastName,
        avatar,
        accessToken,
      });
    } else if (oauthService === "42") {
      const {
        email,
        first_name: firstName,
        last_name: lastName,
        image,
        accessToken,
      } = req.user.apiData;
      const avatarLink = image && image.link ? image.link : null;
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
    } else {
      throw new Error(`Unsupported OAuth service: ${oauthService}`);
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
}
