import { ObjectType, Field, ID } from "@nestjs/graphql";
import { UserModel } from "src/user/models/user.model";
import { ChannelModel } from "./channel.model";

@ObjectType()
export class MessageModel {
    @Field(() => ID)
    id: string
    
    @Field()
    content: string;

    @Field()
    userId: string;

    @Field(() => UserModel, { nullable: true })
    user?: UserModel

    @Field()
    channelId: string;

    @Field(() => ChannelModel, { nullable: true })
    channel?: ChannelModel;

    @Field()
    createdAt: Date;

}