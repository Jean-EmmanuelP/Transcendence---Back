import { Field, InputType } from '@nestjs/graphql'
import {IsEmail, IsNotEmpty } from 'class-validator'

@InputType()
export class LoginDto {
    @Field()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @Field()
    @IsNotEmpty()
    password: string;

    @Field()
    twoFactorCode?: string;
}