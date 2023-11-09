import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { TokenService } from "src/token/services/token/token.service";

@Injectable()
export class TokenRevocationMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    // console.log(`from token revocation : `, token);
    if (token && await this.tokenService.isTokenRevoked(token)) {
      return res.status(401).json({ message: "Token revoked" });
    }

    next();
  }
}
