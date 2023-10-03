import {
  InputType,
  Field,
  ObjectType,
  ID,
  registerEnumType,
} from "@nestjs/graphql";
import { MessageModel } from "../models/message.model";
import { ChannelModel } from "../models/channel.model";

export enum UserAction {
  KICK = "KICK",
  BAN = "BAN",
  MUTE = "MUTE",
  UNMUTE = "UNMUTE",
  UNBAN = "UNBAN",
  ADD = "ADD",
}

registerEnumType(UserAction, {
  name: "UserAction",
  description: "The actions that can be performed on a user",
});

@InputType()
export class ChannelPasswordInput {
  @Field()
  channelId: string;

  @Field({ nullable: true })
  password?: string;
}

@InputType()
export class leaveChannelInput {
  @Field()
  channelId: string
}

@InputType()
export class addChannelAdminInput {
  @Field()
  channelId: string;

  @Field()
  newAdminId: string;
}

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
export class ManageUserInput {
  @Field()
  targetUserId: string;

  @Field()
  channelId: string;

  @Field(() => UserAction)
  action: UserAction;

  @Field({ nullable: true })
  duration?: number;
}

@InputType()
export class CreateChannelInput {
  @Field()
  name: string;

  @Field()
  isPrivate: boolean;

  @Field({ nullable: true })
  password?: string;
}

@ObjectType()
export class OperationResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  error?: string;
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

  @Field(() => ChannelDTO, { nullable: true })
  channel?: ChannelDTO;
}

@InputType()
export class SendMessageInput {
  @Field()
  channelId: string;

  @Field()
  content: string;
}

@InputType()
export class MessageDTO {
  @Field()
  id: string

  @Field()
  content: string
}

@ObjectType()
export class SendMessageOutput {
  @Field()
  success: boolean;

  @Field(() => MessageDTO)
  message: MessageDTO

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

  @Field()
  status: string;
}

@ObjectType()
export class ChannelOutputDTO {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  isPrivate: string;

  @Field(() => [UserOutputDTO])
  members: UserOutputDTO[];
}
