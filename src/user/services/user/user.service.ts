import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { User, Prisma } from '@prisma/client'

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<User[]> {
        return this.prisma.user.findMany();
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({data})
    }
}
