import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UserService } from './../../services/user/user.service';
import { User, Prisma } from '@prisma/client'
import { UserType } from 'src/user/models/user.model';

@Resolver('User')
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    @Query(() => [UserType])
    async users(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Mutation(() => UserType)
    async createUser(@Args('data') data: Prisma.UserCreateInput): Promise<User> {
        return this.userService.create(data);
    }

}
