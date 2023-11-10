import { ObjectType, Field } from "@nestjs/graphql";

@ObjectType()
export class UserModel {
  @Field(() => String)
  id: string;

  @Field()
  email?: string;

  @Field()
  password?: string;

  @Field()
  name: string;

  @Field()
  pseudo: string;

  @Field(() => String)
  avatar?: string;

  @Field()
  twoFactorSecret: string;

  @Field()
  isTwoFactorEnabled: boolean;

  @Field()
  status: string;

  @Field()
  eloScore: number;
}

@ObjectType()
export class FriendModel {
  @Field(() => String)
  id: string;

  @Field()
  email?: string;

  @Field()
  name: string;

  @Field()
  pseudo: string;

  @Field()
  channelId?: string;

  @Field(() => String)
  avatar?: string;

  @Field()
  status: string;
}
