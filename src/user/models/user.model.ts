import { ObjectType, Field, Int } from "@nestjs/graphql";

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
}
