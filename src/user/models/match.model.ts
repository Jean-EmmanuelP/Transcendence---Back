import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserModel } from './user.model';

@ObjectType()
export class SimpleUserModel {
  @Field(() => ID)
  id: string;

  @Field()
  pseudo: string;

  @Field()
  avatar: string;
}

@ObjectType()
export class MatchModel {
  @Field(() => ID)
  id: string;

  @Field()
  player1Id: string;

  @Field()
  player2Id: string;

  @Field(() => SimpleUserModel)
  player1: SimpleUserModel;

  @Field(() => SimpleUserModel)
  player2: SimpleUserModel;

  @Field({ nullable: true })
  winnerId?: string;

  @Field()
  playedAt: Date;

//   @Field(() => UserModel)
//   player1: UserModel;

//   @Field(() => UserModel)
//   player2: UserModel;

//   @Field(() => UserModel, { nullable: true })
//   winner?: UserModel;
}