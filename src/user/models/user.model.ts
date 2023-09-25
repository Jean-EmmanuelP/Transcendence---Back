import { ObjectType, Field, Int } from "@nestjs/graphql";
import { IsEmail } from "class-validator";

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
  avatar?: string;

  @Field()
  twoFactorSecret: string;

  @Field()
  isTwoFactorEnabled: boolean;
}
