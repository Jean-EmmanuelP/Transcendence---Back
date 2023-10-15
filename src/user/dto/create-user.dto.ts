import { InputType, Field, ObjectType, registerEnumType } from "@nestjs/graphql";
import { IsString, IsOptional, IsEmail, IsNotEmpty, IsEnum } from "class-validator";

@InputType()
export class CreateUserDto {
    @Field()
    @IsString()
    name: string;

    @Field({ nullable: true })
    @IsEmail()
    @IsOptional()
    email?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    password?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    avatar?: string;
}

export enum FriendshipStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
}

registerEnumType(FriendshipStatus, {
    name: "FriendshipStatus",
});

@ObjectType()
export class Friendship {
    @Field()
    @IsString()
    @IsNotEmpty()
    senderId: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    receiverId: string;

    @Field(() => FriendshipStatus, { defaultValue: FriendshipStatus.PENDING })
    @IsEnum(FriendshipStatus)
    status: FriendshipStatus;
}