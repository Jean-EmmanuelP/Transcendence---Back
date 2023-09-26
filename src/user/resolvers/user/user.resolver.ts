import { Resolver, Query, Args, Mutation } from "@nestjs/graphql";
import { UserService } from "./../../services/user/user.service";
import { UserModel } from "src/user/models/user.model";
import { CreateUserDto } from "src/user/dto/create-user.dto";
import { GraphQLUpload } from 'graphql-upload';
import { FileInput } from "src/user/input_type/file-upload";
import { createWriteStream } from "fs";
import { join } from "path";
import { HttpException, HttpStatus, Req, Request, UseGuards } from "@nestjs/common";
import { FortyTwoGuard } from "src/guards/forty-two.guard";
import { FileUpload } from "graphql-upload-ts";
import { UploadImageResponse } from "src/user/interfaces/upload-image-reponse";

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
  @UseGuards(FortyTwoGuard)
  @Mutation(() => UserModel)
  async uploadAvatar(@Request() req, @Args({ name: 'image', type: () => GraphQLUpload }) image: FileUpload): Promise<UploadImageResponse> {
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
  // should be able to enable / disable the two-factor-authentication
  // add other users as friends ->  see their current status (online, offline, in a game)
  // should be able to check its own history -> (wins and losses, ladder level, achievements) 
}
