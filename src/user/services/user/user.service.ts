import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserModel } from 'src/user/models/user.model';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<UserModel[]> {
        return this.prisma.user.findMany();
    }

    async create(data: CreateUserDto): Promise<UserModel> {
        return this.prisma.user.create({data})
    }
}
