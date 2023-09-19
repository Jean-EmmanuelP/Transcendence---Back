import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<User[]>;
    create(data: Prisma.UserCreateInput): Promise<User>;
}
