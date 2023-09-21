import { InputType, Field } from "@nestjs/graphql";
import { IsString, IsOptional, IsEmail } from "class-validator";

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
