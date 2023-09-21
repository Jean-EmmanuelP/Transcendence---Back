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
}
