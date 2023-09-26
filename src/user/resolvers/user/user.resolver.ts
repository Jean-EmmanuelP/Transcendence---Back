import { Resolver, Query, Args, Mutation } from "@nestjs/graphql";
import { UserService } from "./../../services/user/user.service";
import { UserModel } from "src/user/models/user.model";
import { CreateUserDto } from "src/user/dto/create-user.dto";
import { GraphQLUpload } from 'graphql-upload-ts';
import { createWriteStream } from "fs";
import { join } from "path";
import { HttpException, HttpStatus, Req, Request, UseGuards } from "@nestjs/common";
import { FileUpload } from "graphql-upload-ts";
import { UploadImageResponse } from "src/user/interfaces/upload-image-reponse";

// to access the resolver, you need to have a valid jwt so we will pass a middleware or a guard for everything or even do the middleware and only exclude auth from it
@Resolver((of) => UserModel)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [UserModel])
  async users(): Promise<UserModel[]> {
    return this.userService.findAll();
  }

  // upload an avatar
  // you must find how to test it
  @Mutation(() => UserModel)
  async uploadAvatar(@Request() req, @Args({ name: 'image', type: () => GraphQLUpload }) image: FileUpload): Promise<UploadImageResponse | Error> {
    const { createReadStream, filename } = await image;
    const userId = req.user.userId;

    return new Promise(async (resolve, reject) => {
      createReadStream()
      .pipe(createWriteStream(join(process.cwd(), `./src/upload/${filename}`)))
      .on('finish', async () => {
        try {
          const uploadAvatar =  await this.userService.updateAvatar(userId, filename);
          resolve(uploadAvatar);
        } catch(error) {
          reject(error);
        }
      })
      .on('error', () => {
        reject(new HttpException('Could not save image', HttpStatus.BAD_REQUEST))
      })
    })
  }

  // should be able to check its own information via its id (via jwt token decrypted)
  @Query(() => UserModel)
  async user(@Request() req): Promise<UserModel> {
    const userId = req.user.userId
    return this.userService.findOne(userId)
  }

  // should be able to enable / disable the two-factor-authentication [REST API]
  // must go to the auth.controller -> enable-two-factor
  // must go to the auth.controller -> disable-two-factor

  // add other users as friends ->  see their current status (online, offline, in a game)
  @Mutation(() => Boolean)
  async sendFriendRequest(@Request() req, @Args('receiverId') receiverId: string): Promise<boolean> {
    const senderId = req.user.userId;
    return this.userService.sendFriendRequest(senderId, receiverId);
  }

  @Mutation(() => Boolean)
  async acceptFriendRequest(@Request() req, @Args('senderId') senderId: string): Promise<boolean> {
    const receiverId = req.user.userId;
    return this.userService.acceptFriendRequest(senderId, receiverId);
  }

  @Mutation(() => Boolean)
  async rejectFriendRequest(@Request() req, @Args('senderId') senderId: string): Promise<boolean> {
    const receiverId = req.user.userId;
    return this.userService.rejectFriendRequest(senderId, receiverId);
  }

  @Mutation(() => Boolean)
  async cancelSentFriendRequest(@Request() req, @Args('receiverId') receiverId: string): Promise<boolean> {
    const senderId = req.user.userId;
    return this.userService.cancelSentFriendRequest(senderId, receiverId);
  }
  // should be able to check its own history -> (wins and losses, ladder level, achievements) 
  
}
