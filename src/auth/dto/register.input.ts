import { Field, InputType } from "@nestjs/graphql";
import { ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

@InputType()
@ApiTags("Registration")
export class RegisterDto {
  @ApiProperty({
    description: "Register a user",
  })
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @Field()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;
}
