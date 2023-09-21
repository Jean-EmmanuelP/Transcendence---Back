import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/services/prisma/prisma.service";
import { User } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/services/user/user.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && user.password === password) {
      // Ideally, you'd hash the password and compare the hashed values.
      const { password, ...result } = user;
      return {
        access_token: this.jwtService.sign(result),
      };
    }
    throw new UnauthorizedException("Invalid credentials");
  }

  async validateOAuthUser(
    token: string,
    provider: "google" | "42"
  ): Promise<any> {
    // Here, you'd use the token to fetch the user's info from the OAuth provider.
    // Then, you'd check if they exist in your DB or create them if they don't.
    // After which, you'd return a JWT for them.
    let user: User;
    if (provider === "google") {
      // Fetch user from Google using the token, then find or create in your DB.
    } else if (provider === "42") {
      // Fetch user from 42's API using the token, then find or create in your DB.
    }
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return {
      access_token: this.jwtService.sign(user),
    };
  }

  async OauthLogin(req, oauthService: "google" | "42") {
    if (!req.user) {
      return `No user from ${oauthService}`;
    }

    let user;
    
    if (oauthService === "google") {
      const { email, firstName, lastName, picture, accessToken } =
      req.user;
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
      const avatarLink = image && image.link ? image.link : null; // vérifiez si image et image.link existent
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

    return {
      message: "User information saved in the database",
      user: user,
    };
  }
}
