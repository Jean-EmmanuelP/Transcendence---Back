import { Resolver, Query, Args, Mutation, Context } from "@nestjs/graphql";
import { UserService } from "./../../services/user/user.service";
import { UserModel } from "src/user/models/user.model";
import { CreateUserDto, Friendship } from "src/user/dto/create-user.dto";
import { GraphQLUpload } from "graphql-upload-ts";
import { createWriteStream } from "fs";
import { join } from "path";
import {
  HttpException,
  HttpStatus,
  Req,
  Request,
  UseGuards,
} from "@nestjs/common";
import { FileUpload } from "graphql-upload-ts";
import { UploadImageResponse } from "src/user/interfaces/upload-image-reponse";
import { JwtAuthGuard } from "src/guards/jwt.guard";

@Resolver((of) => UserModel)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [UserModel])
  @UseGuards(JwtAuthGuard)
  async users(): Promise<UserModel[]> {
    return this.userService.findAll();
  }

  @Query((returns) => [Friendship])
  @UseGuards(JwtAuthGuard)
  async getPendingSentFriendRequests(
    @Context() context
  ): Promise<Friendship[]> {
    const req = context.req;
    const userId = req.user.userId;
    return this.userService.getPendingSentFriendRequests(userId);
  }

  // upload an avatar
  // you must find how to test it
  @Mutation(() => UserModel)
  @UseGuards(JwtAuthGuard)
  async uploadAvatar(
    @Context() context,
    @Args({ name: "image", type: () => GraphQLUpload }) image: FileUpload
  ): Promise<UploadImageResponse | Error> {
    const { createReadStream, filename } = await image;
    const req = context.req;
    const userId = req.user.userId;

    return new Promise(async (resolve, reject) => {
      createReadStream()
        .pipe(
          createWriteStream(join(process.cwd(), `./src/upload/${filename}`))
        )
        .on("finish", async () => {
          try {
            const uploadAvatar = await this.userService.updateAvatar(
              userId,
              filename
            );
            resolve(uploadAvatar);
          } catch (error) {
            reject(error);
          }
        })
        .on("error", () => {
          reject(
            new HttpException("Could not save image", HttpStatus.BAD_REQUEST)
          );
        });
    });
  }

  @Query((returns) => String)
  async testingConnexion() {
    let test = "The connexion to the back has been established CONGRATS!";
    return test;
  }

  // should be able to check its own information via its id (via jwt token decrypted)
  @Query((returns) => UserModel)
  @UseGuards(JwtAuthGuard)
  async userInformation(@Context() context): Promise<UserModel> {
    const req = context.req;
    console.log("This is the information of the user", req);
    const userId = req.user.userId;
    if (!userId) throw new Error("There is no userId in the JWT");
    return this.userService.findOne(userId);
  }

  @Query((returns) => [UserModel])
  @UseGuards(JwtAuthGuard)
  async getAllFriendsOfUser(@Context() context): Promise<UserModel[]> {
    const req = context.req;
    const userId = req.user.userId;
    if (!userId) {
      throw new Error("UserId not found in the JWT");
    }
    return this.userService.getAllFriendOfUser(userId);
  }

  // should be able to enable / disable the two-factor-authentication [REST API]
  // must go to the auth.controller -> enable-two-factor
  // must go to the auth.controller -> disable-two-factor

  // add other users as friends ->  see their current status (online, offline, in a game)
  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async sendFriendRequest(
    @Context() context,
    @Args("receiverPseudo") receiverPseudo: string
  ): Promise<boolean> {
    const req = context.req;
    const senderId = req.user.userId;

    const receiver = await this.userService.findByPseudo(receiverPseudo);
    if (!receiver) {
      throw new Error("User not found");
    }

    return this.userService.sendFriendRequest(senderId, receiver.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async acceptFriendRequest(
    @Context() context,
    @Args("senderPseudo") senderPseudo: string
  ): Promise<boolean> {
    const req = context.req;
    const receiverId = req.user.userId;
    const sender = await this.userService.findByPseudo(senderPseudo);
    if (!receiverId) {
      throw new Error("User not found");
    }
    if (!sender) {
      throw new Error("Sender not found");
    }
    return this.userService.acceptFriendRequest(sender.id, receiverId);
  }

  @Query((returns) => [UserModel])
  @UseGuards(JwtAuthGuard)
  async searchUsers(
    @Args("term", { type: () => String }) term: string
  ): Promise<UserModel[]> {
    return this.userService.searchUsersByNameOrPseudo(term);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async rejectFriendRequest(
    @Context() context,
    @Args("senderPseudo") senderPseudo: string
  ): Promise<boolean> {
    const req = context.req;
    const receiverId = req.user.userId;
    if (!receiverId) {
      throw new Error("User not found");
    }
    const sender = await this.userService.findByPseudo(senderPseudo);
    if (!sender) {
      throw new Error("Sender not found");
    }
    return this.userService.rejectFriendRequest(sender.id, receiverId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async cancelSentFriendRequest(
    @Context() context,
    @Args("receiverPseudo") receiverPseudo: string
  ): Promise<boolean> {
    const req = context.req;
    const senderId = req.user.userId;
    if (!senderId) {
      throw new Error("Sender not found");
    }
    const receiver = await this.userService.findByPseudo(receiverPseudo);
    if (!receiver) {
      throw new Error("User not found");
    }
    return this.userService.cancelSentFriendRequest(senderId, receiver.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async updatePseudo(
    @Context() context,
    @Args("newPseudo") newPseudo: string
  ): Promise<boolean> {
    const req = context.req;
    const userId = req.user.userId;
    return this.userService.updatePseudo(userId, newPseudo);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async forgotPassword(@Args("email") email: string): Promise<boolean> {
    try {
      await this.userService.forgotPassword(email);
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async resetPassword(
    @Args("resetToken") resetToken: string,
    @Args("newPassword") newPassword: string
  ): Promise<boolean> {
    try {
      await this.userService.resetPassword(resetToken, newPassword);
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Context() context,
    @Args("currentPassword") currentPassword: string,
    @Args("newPassword") newPassword: string
  ): Promise<boolean> {
    try {
      const req = context.req;
      const userId = req.user.userId;
      return await this.userService.changePassword(
        userId,
        currentPassword,
        newPassword
      );
    } catch (error) {
      console.log(error.message);
      return false;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Context() context): Promise<boolean> {
    const req = context.req;
    const userId = req.user.userId;
    if (!userId) throw new Error("User not found in the JWT");
    try {
      return await this.userService.deleteAccount(userId);
    } catch (error) {
      console.log(error);
      throw new Error("Failed to delete account");
    }
  }
  // should be able to check its own history -> (wins and losses, ladder level, achievements)
}
