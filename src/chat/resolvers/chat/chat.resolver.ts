import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ChatService } from "src/chat/services/chat/chat.service";
import {
  ChannelOutputDTO,
  ChannelPasswordInput,
  CreateChannelInput,
  CreateChannelOutput,
  DeleteMessageInput,
  DeleteMessageOutput,
  GetMessageInput,
  ManageUserInput,
  OperationResult,
  SendMessageInput,
  SendMessageOutput,
  UpdateMessageInput,
  UpdateMessageOutput,
  addChannelAdminInput,
  leaveChannelInput,
} from "src/chat/services/chat/dtos/channel-dtos";
import { MessageModel } from "src/chat/services/chat/models/message.model";
import { User } from "src/common/decorators/user.decorator";
import { JwtAuthGuard } from "src/guards/jwt.guard";

@Resolver()
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}
  // commented it cause we createdirectchannel automatically when a user accept the request of another user!
  // @Mutation(() => CreateDirectChannelOutput)
  // async createDirectChannel(
  //     @Args('input') input: createDirectChannelInput,
  // ): Promise<CreateDirectChannelOutput> {
  //     return this.chatService.createDirectChannel(input);
  // }
  @Mutation(() => SendMessageOutput)
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Args("input") input: SendMessageInput,
    @User() userId: string
  ): Promise<SendMessageOutput> {
    return this.chatService.sendMessage(input.channelId, userId, input.content);
  }

  @Mutation(() => UpdateMessageOutput)
  @UseGuards(JwtAuthGuard)
  async updateMessage(
    @Args("input") input: UpdateMessageInput,
    @User() userId: string
  ): Promise<UpdateMessageOutput> {
    return this.chatService.updateMessage(
      input.messageId,
      userId,
      input.newContent
    );
  }

  @Mutation(() => DeleteMessageOutput)
  @UseGuards(JwtAuthGuard)
  async deleteMessage(
    @Args("input") input: DeleteMessageInput,
    @User() userId: string
  ): Promise<DeleteMessageOutput> {
    return this.chatService.deleteMessage(input.messageId, userId);
  }

  @Mutation(() => OperationResult)
  @UseGuards(JwtAuthGuard)
  async manageUser(
    @User() userId: string,
    @Args("input") input: ManageUserInput
  ): Promise<OperationResult> {
    return this.chatService.manageUser(userId, input);
  }

  @Mutation(() => CreateChannelOutput)
  @UseGuards(JwtAuthGuard)
  async createChannel(
    @User() userId: string,
    @Args("input") input: CreateChannelInput
  ): Promise<CreateChannelOutput> {
    return this.chatService.createChannel(input, userId);
  }

  @Mutation(() => OperationResult)
  @UseGuards(JwtAuthGuard)
  async setChannelPassword(
    @User() userId: string,
    @Args("input") input: ChannelPasswordInput
  ): Promise<OperationResult> {
    const { channelId, password } = input;
    return this.chatService.setChannelPassword(channelId, password, userId);
  }

  @Mutation(() => OperationResult)
  @UseGuards(JwtAuthGuard)
  async addChannelAdmin(
    @User() userId: string,
    @Args("input") input: addChannelAdminInput
  ): Promise<OperationResult> {
    const { channelId, newAdminId } = input;
    return this.chatService.addChannelAdmin(channelId, newAdminId, userId);
  }

  @Mutation(() => OperationResult)
  @UseGuards(JwtAuthGuard)
  async leaveChannel(
    @User() userId: string,
    @Args("input") input: leaveChannelInput
  ): Promise<OperationResult> {
    const { channelId } = input;
    return this.chatService.leaveChannel(userId, channelId);
  }

  @Mutation(() => OperationResult)
  @UseGuards(JwtAuthGuard)
  async joinChannel(@User() userId: string, @Args("input") input: joinChannelInput)

  @Query(() => [MessageModel], { nullable: "items" })
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Args("input") input: GetMessageInput,
    @User() userId: string
  ): Promise<MessageModel[]> {
    return this.chatService.getMessages(userId, input.channelId);
  }

  @Query(() => [ChannelOutputDTO], { nullable: "items" })
  @UseGuards(JwtAuthGuard)
  async getUsersChannel(
    @User() userId: string
  ): Promise<ChannelOutputDTO[] | undefined[]> {
    return this.chatService.getUserChannels(userId);
  }
}
