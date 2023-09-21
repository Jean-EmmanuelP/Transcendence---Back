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

  googleLogin(req) {
    if (!req.user) {
      return "No user from google";
    }

    return {
      message: "User information from google",
      user: req.user,
    };
  }
}
