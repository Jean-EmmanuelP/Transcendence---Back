import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { TokenService } from "src/token/services/token/token.service";

@Injectable()
export class TokenRevocationMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[0];

    if (token && this.tokenService.isTokenRevoked(token)) {
      return res.status(401).json({ message: "Token revoked" });
    }

    next();
  }
}
