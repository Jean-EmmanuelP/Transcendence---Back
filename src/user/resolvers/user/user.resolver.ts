import { Resolver, Query, Args, Mutation } from "@nestjs/graphql";
import { UserService } from "./../../services/user/user.service";
import { UserModel } from "src/user/models/user.model";
import { CreateUserDto } from "src/user/dto/create-user.dto";

@Resolver((of) => UserModel)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [UserModel])
  async users(): Promise<UserModel[]> {
    return this.userService.findAll();
  }

  @Mutation(() => UserModel)
  async createUser(@Args("data") data: CreateUserDto): Promise<UserModel> {
    return this.userService.create(data);
  }

  // query with a particular id
  email, name, friends
  //
}
