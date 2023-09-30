import { InputType, Field, ObjectType } from "@nestjs/graphql"; 
import { MessageModel } from "../models/message.model";

@InputType()
export class createDirectChannelInput {
    @Field()
    userId1: string
    
    @Field()
    userId2: string
}

@ObjectType()
export class CreateDirectChannelOutput {
    @Field()
    success: boolean;

    @Field({ nullable: true })
    error?: string;
}

@InputType()
export class SendMessageInput {
    @Field()
    channelId: string;

    @Field()
    content: string;
}

@ObjectType()
export class SendMessageOutput {
    @Field()
    success: boolean;

    @Field({ nullable: true })
    error?: string;
}

@InputType()
export class GetMessageInput {
    @Field()
    channelId: string;
}

@ObjectType()
export class MessageObjectType {
    @Field()
    content: string;
}

@ObjectType()
export class GetMessageOutput {
    @Field(() => [MessageModel])
    messages: MessageModel[];

    @Field({ nullable: true })
    error?: string;
}

@InputType()
export class UpdateMessageInput {
    @Field()
    messageId: string;

    @Field()
    newContent: string;
}

@ObjectType()
export class UpdateMessageOutput {
    @Field()
    success: boolean;

    @Field({ nullable: true })
    error?: string;
}

@InputType()
export class DeleteMessageInput {
  @Field()
  messageId: string;
}

@ObjectType()
export class DeleteMessageOutput {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  error?: string;
}