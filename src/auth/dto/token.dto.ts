import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Token {
  @Field()
  access_token: string;
  
  @Field({ nullable: true })
  token_type?: string;

  @Field({ nullable: true })
  expires_in?: number;

  @Field({ nullable: true })
  scope?: string;

  @Field({ nullable: true })
  created_at?: number;
}
