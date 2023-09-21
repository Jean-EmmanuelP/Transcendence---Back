import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/services/prisma/prisma.service";
import { CreateUserDto } from "src/user/dto/create-user.dto";
import { UserModel } from "src/user/models/user.model";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserModel[]> {
    return this.prisma.user.findMany();
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({
      where: { email: email },
    });
  }

  async create(data: CreateUserDto): Promise<UserModel> {
    return this.prisma.user.create({ data });
  }

  async upsertOAuthUser({
    email,
    firstName,
    lastName,
    avatar,
    accessToken,
  }: {
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    accessToken: string;
  }): Promise<UserModel> {
    let user = await this.findByEmail(email);

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: email,
          name: `${firstName} ${lastName}`,
          avatar: avatar,
          oauth: {
            create: {
              accessToken: accessToken,
              tokenType: "Bearer",
              createdAt: Math.floor(Date.now() / 1000),
            },
          },
        },
      });
    } else {
      await this.prisma.oAuth.update({
        where: { userId: user.id },
        data: {
          accessToken: accessToken,
        },
      });
    }

    return user;
  }
}
