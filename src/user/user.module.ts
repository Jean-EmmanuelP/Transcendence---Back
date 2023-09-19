import { Module } from '@nestjs/common';
import { UserResolver } from './resolvers/user/user.resolver';
import { UserService } from './services/user/user.service';

@Module({
  providers: [UserService, UserResolver]
})
export class UserModule {}
