// strategies/42.strategy.ts

import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
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
      callbackURL: "http://localhost:3000/auth/42-redirect",
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<any> {
    // Le profil contient désormais les informations de l'utilisateur retournées par 42.
    // Ici, vous pouvez décider de ce que vous voulez faire avec ces informations,
    // comme les stocker dans votre base de données, etc.

    // Pour l'instant, retournons simplement l'utilisateur.
    console.log(`You went here`);
    return {
      profile
    };
  }
}
