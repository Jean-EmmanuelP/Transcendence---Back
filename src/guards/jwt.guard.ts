import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JwtService } from "@nestjs/jwt";
import { TokenExpiredError } from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    // console.log(`from the canactivate`, request.headers.authorization);
    if (!request.headers.authorization)
      throw new UnauthorizedException('Invalid token');
    const token = request.headers.authorization?.split(' ')[1];
    try {
      const { isTemporary } = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      if (isTemporary && request.path !== '/auth/validate-two-factor') {
        throw new UnauthorizedException('Invalid token');
      }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Your session has expired. Please log in again.');
      } else {
        throw new UnauthorizedException(`Invalid token ${error.message}`)
      }
    }
    return super.canActivate(context);
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
