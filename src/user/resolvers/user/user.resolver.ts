import { Resolver, Query, Args, Mutation } from "@nestjs/graphql";
import { UserService } from "./../../services/user/user.service";
import { UserModel } from "src/user/models/user.model";
import { CreateUserDto } from "src/user/dto/create-user.dto";
import { GraphQLUpload } from 'graphql-upload';

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

  // upload an avatar
  @Mutation(() => UserModel)
  async uploadAvatar(@Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload) : Promise<boolean> {
    const { filename, mimetype, createReadStream } = await file;
    const readStream = createReadStream()
    
    // todo : stream file to your storage location and handle any errors

    return true;
  }
  // should be able to enable / disable the two-factor-authentication
  // add other users as friends ->  see their current status (online, offline, in a game)
  // should be able to check its own history -> (wins and losses, ladder level, achievements) 
}
