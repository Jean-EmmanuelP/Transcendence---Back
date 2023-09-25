import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  getRequest(context: ExecutionContext) {
    console.log("Getting request from context");
    const ctx = GqlExecutionContext.create(context);
    console.log(`-------------------------------------`);
    console.log(`ctx.getContext().req`, ctx.getContext().req);
    console.log(`-------------------------------------`);
    return ctx.getContext().req;
  }
}
