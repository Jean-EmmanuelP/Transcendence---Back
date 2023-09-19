import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateUserDto {
    @Field()
    name: string;
}