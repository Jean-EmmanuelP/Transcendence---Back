import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChatService } from 'src/chat/services/chat/chat.service';
import { CreateDirectChannelOutput, createDirectChannelInput } from 'src/chat/services/chat/dtos/channel-dtos';

@Resolver()
export class ChatResolver {
    constructor(private readonly chatService: ChatService) {}

    @Mutation(() => CreateDirectChannelOutput)
    async createDirectChannel(
        @Args('input') input: createDirectChannelInput,
    ): Promise<CreateDirectChannelOutput> {
        return this.chatService.createDirectChannel(input);
    }
}
