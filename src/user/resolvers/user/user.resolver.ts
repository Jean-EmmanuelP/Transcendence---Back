import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UserService } from './../../services/user/user.service';
import { Prisma } from '@prisma/client'
import { UserModel } from 'src/user/models/user.model';

@Resolver(of => UserModel)
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    @Query(() => [UserModel])
    async users(): Promise<UserModel[]> {
        return this.userService.findAll();
    }

    @Mutation(() => UserModel)
    async createUser(@Args('data') data: Prisma.UserCreateInput): Promise<UserModel> {
        return this.userService.create(data);
    }

}
