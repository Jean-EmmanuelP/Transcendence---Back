import { InputType, Field, ObjectType, registerEnumType } from "@nestjs/graphql";
import { IsString, IsOptional, IsEmail, IsNotEmpty, IsEnum } from "class-validator";
import { UserModel } from "../models/user.model";

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

export const FriendshipStatus = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
} as const;

registerEnumType(FriendshipStatus, {
    name: "FriendshipStatus",
});

@ObjectType()
export class Friendship {
    @Field()
    id: string;

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
    status: keyof typeof FriendshipStatus;

    @Field(() => UserModel, { nullable: true })
    sender?: UserModel

	@Field(() => UserModel, { nullable: true })
    receiver?: UserModel

    @Field()
    createdAt: Date
}
