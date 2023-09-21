import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from 'src/auth/services/auth/auth.service';
import { AuthInput } from '../../dto/auth.input';
import { Token } from '../../dto/token.dto';

@Resolver('auth')
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => Token)
  async login(@Args('data') data: AuthInput): Promise<Token> {
    return this.authService.validateUser(data.email, data.password);
  }

  @Mutation(() => Token)
  async googleAuth(@Args('token') token: string): Promise<Token> {
    return this.authService.validateOAuthUser(token, 'google');
  }

  @Mutation(() => Token)
  async auth42(@Args('token') token: string): Promise<Token> {
    return this.authService.validateOAuthUser(token, '42');
  }
}
