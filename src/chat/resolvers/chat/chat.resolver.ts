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
  GetChannelInput,
  GetMessageInput,
  ManageUserInput,
  OperationResult,
  SendMessageInput,
  SendMessageOutput,
  UpdateMessageInput,
  UpdateMessageInviteInput,
  UpdateMessageOutput,
  addChannelAdminInput,
  blockUserInput,
  joinChannelInput,
  leaveChannelInput,
} from "src/chat/services/chat/dtos/channel-dtos";
import { MessageModel } from "src/chat/services/chat/models/message.model";
import { User } from "src/common/decorators/user.decorator";
import { JwtAuthGuard } from "src/guards/jwt.guard";

@Resolver()
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}
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

  @Mutation(() => UpdateMessageOutput)
  @UseGuards(JwtAuthGuard)
  async updateMessageInvite(
    @Args("input") input: UpdateMessageInviteInput,
    @User() userId: string
  ): Promise<UpdateMessageOutput> {
    return this.chatService.updateMessageInvite(
      input.messageId,
      userId,
      input.content
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
  async leaveChannel(
    @User() userId: string,
    @Args("input") input: leaveChannelInput
  ): Promise<OperationResult> {
    const { channelId } = input;
    return this.chatService.leaveChannel(userId, channelId);
  }

  @Mutation(() => OperationResult)
  @UseGuards(JwtAuthGuard)
  async joinChannel(
    @User() userId: string,
    @Args("input") input: joinChannelInput
  ): Promise<OperationResult> {
    return this.chatService.joinChannel(
      userId,
      input.channelId,
      input.passwordInput
    );
  }

  @Mutation(() => OperationResult)
  @UseGuards(JwtAuthGuard)
  async blockUser(
    @User() userId: string,
    @Args("input") input: blockUserInput
  ): Promise<OperationResult> {
    return this.chatService.blockUser(userId, input.blockedId);
  }

  @Query(() => [MessageModel], { nullable: "items" })
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Args("input") input: GetMessageInput,
    @User() userId: string
  ): Promise<MessageModel[]> {
    return this.chatService.getMessages(userId, input.channelId);
  }

  @Query(() => ChannelOutputDTO, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async getChannel(
	@Args("input") input: GetChannelInput,
    @User() userId: string,
  ): Promise<ChannelOutputDTO | undefined> {
    return this.chatService.getChannel(userId, input.channelId);
  }

  @Query(() => [ChannelOutputDTO], { nullable: "items" })
  @UseGuards(JwtAuthGuard)
  async getUsersChannel(
    @User() userId: string
  ): Promise<ChannelOutputDTO[] | undefined[]> {
    return this.chatService.getUserChannels(userId);
  }

  @Query(() => [ChannelOutputDTO], { nullable: "items" })
  @UseGuards(JwtAuthGuard)
  async getAllChannels(
    @User() userId: string
  ): Promise<ChannelOutputDTO[] | undefined[]> {
    return this.chatService.getAllChannels(userId);
  }
}
