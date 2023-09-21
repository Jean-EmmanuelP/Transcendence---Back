import { ObjectType, Field } from "@nestjs/graphql";

@ObjectType()
export class OauthModel {
    @Field(() => String)
    id: string

    @Field()
    accessToken: string

    @Field()
    tokenType: string

    @Field()
    expiresIn: string

    @Field()
    scope: string
}