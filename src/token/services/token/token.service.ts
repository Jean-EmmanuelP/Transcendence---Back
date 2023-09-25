import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaService) {}

  async revokeToken(token: string): Promise<void> {
    await this.prisma.token.create({
      data: {
        value: token,
      },
    });
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const foundToken = await this.prisma.token.findUnique({
      where: {
        value: token,
      },
    });
    return !!foundToken;
  }
}
