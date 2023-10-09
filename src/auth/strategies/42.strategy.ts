// strategies/42.strategy.ts

import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import axios from "axios";
import { Strategy as FortyTwoStrategy } from "passport-42";

@Injectable()
export class FortyTwoAuthStrategy extends PassportStrategy(
  FortyTwoStrategy,
  "42"
) {
  constructor() {
    super({
      clientID: process.env.FORTYTWO_CLIENT_ID,
      clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
      callbackURL: "http://42pong.com:3000/auth/42-redirect",
    });
  }

  async validate(
    accessToken: string,
    profile: any
  ): Promise<any> {
    const apiResponse = await axios.get('https://api.intra.42.fr/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    // console.log(apiResponse.data.first_name);
    // console.log(accessToken);
    return {
      apiData: {
        ...apiResponse.data,
        accessToken
      }
    };
  }
}
