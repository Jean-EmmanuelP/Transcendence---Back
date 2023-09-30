import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChatService } from 'src/chat/services/chat/chat.service';
import { CreateDirectChannelOutput, createDirectChannelInput } from 'src/chat/services/chat/dtos/channel-dtos';

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
}
