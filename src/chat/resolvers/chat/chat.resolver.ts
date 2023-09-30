import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ChatService } from 'src/chat/services/chat/chat.service';
import { CreateDirectChannelOutput, DeleteMessageInput, DeleteMessageOutput, GetMessageInput, GetMessageOutput, SendMessageInput, SendMessageOutput, UpdateMessageOutput, createDirectChannelInput } from 'src/chat/services/chat/dtos/channel-dtos';
import { UpdateMessageOutput } from './../../services/chat/dtos/channel-dtos';
import { ChannelModel } from 'src/chat/services/chat/models/channel.model';

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
    async sendMessage(@Args('input') input: SendMessageInput): Promise<SendMessageOutput> {
        return this.chatService.sendMessage(input);
    }

    @Mutation(() => UpdateMessageOutput)
    async updateMessage(@Args('input') input: UpdateMessageOutput): Promise<UpdateMessageOutput> {
        return this.chatService.updateMessage(input);
    }

    @Mutation(() => DeleteMessageOutput)
    async deleteMessage(@Args('input') input: DeleteMessageInput): Promise<DeleteMessageOutput> {
        return this.chatService.deleteMessage(input);
    }
    
    @Query(() => GetMessageOutput)
    async getMessages(@Args('input') input: GetMessageInput): Promise<GetMessageOutput> {
        return this.chatService.getMessages(input);
    }

    @Query(() => [ChannelModel])
    async getUsersChannel(@Args('userId') userId: string): Promise<ChannelModel[]> {
        return this.chatService.getUserChannels(userId);
    }
}
