import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { UserModel } from 'src/user/models/user.model';

@InputType()
export class AuthInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(8)
  password: string;
}

@ObjectType()
export class AuthOutput {
  @Field()
  message: string;

  @Field(() => UserModel, { nullable: true })
  user?: UserModel;

  @Field()
  access_token: string;
}