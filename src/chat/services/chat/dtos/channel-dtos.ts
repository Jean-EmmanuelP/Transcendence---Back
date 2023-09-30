import { InputType, Field, ObjectType, ID } from "@nestjs/graphql";
import { MessageModel } from "../models/message.model";
import { ChannelModel } from "../models/channel.model";

@InputType()
export class CreateDirectChannelInput {
  @Field()
  userId1: string;

  @Field()
  userId2: string;
}

@ObjectType()
export class CreateDirectChannelOutput {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  error?: string;
}

@InputType()
export class CreateChannelInput {
  @Field()
  name: string;

  @Field()
  isPrivate: boolean;

  @Field({ nullable: true })
  password?: string;

  @Field()
  ownerId: string;
}

@ObjectType()
export class ChannelDTO {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  isPrivate: boolean;

  @Field({ nullable: true })
  password?: string;

  @Field()
  ownerId: string;
}

@ObjectType()
export class CreateChannelOutput {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => ChannelOutputDTO, { nullable: true })
  channel?: ChannelDTO
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

@ObjectType()
export class UserOutputDTO {
  @Field()
  name: string;

  @Field()
  avatar: string;
}

@ObjectType()
export class ChannelOutputDTO {
  @Field()
  id: string;

  @Field(() => [UserOutputDTO])
  members: UserOutputDTO[];
}
