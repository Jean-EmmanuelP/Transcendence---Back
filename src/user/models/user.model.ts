import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field(() => String)
  id: string;

  @Field()
  name: string;
}