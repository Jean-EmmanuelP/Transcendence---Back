import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserModel } from 'src/user/models/user.model';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<UserModel[]>;
    create(data: CreateUserDto): Promise<UserModel>;
}
