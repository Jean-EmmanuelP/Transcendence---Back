import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    console.log(`from the canactivate`, request.headers.authorization);  
    const token = request.headers.authorization?.split(' ')[1];
    const { isTemporary } = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    if (isTemporary && request.path !== '/auth/validate-two-factor') {
      throw new UnauthorizedException('Invalid token');
    }

    return super.canActivate(context);
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
