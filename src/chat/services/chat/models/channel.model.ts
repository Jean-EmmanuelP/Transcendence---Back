import { Field, ID, ObjectType } from "@nestjs/graphql";
import { UserModel } from "src/user/models/user.model";
import { MessageModel } from "./message.model";

@ObjectType()
export class ChannelModel {
    @Field(() => ID)
    id: string;

    @Field()
    name: string

    @Field()
    isPrivate: boolean;

    @Field()
    isDirectMessage: boolean;

    @Field({ nullable: true })
    password?: string;

    @Field(() => UserModel, {nullable: true})
    owner?: UserModel;

    @Field(() => [MessageModel])
    message: MessageModel[];

    @Field(() => [UserModel])
    members: UserModel[];

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}