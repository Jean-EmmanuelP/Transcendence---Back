import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserStatsModel {
    @Field(type => Int)
    victories: number;

    @Field(type => Int)
    draws: number;

    @Field(type => Int)
    losses: number;

    @Field(type => Int)
    totalGames: number;

    @Field(type => Int)
    winRatio: number

    @Field(type => Int)
    drawRatio: number

    @Field(type => Int)
    lossRatio: number
}