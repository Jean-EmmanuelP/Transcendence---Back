import { ObjectType, Field, Int } from '@nestjs/graphql';
import { OAuth } from '@prisma/client';
import { IsEmail } from 'class-validator';

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
}