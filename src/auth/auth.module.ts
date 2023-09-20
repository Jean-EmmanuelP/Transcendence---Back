import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthResolver } from './resolvers/auth/auth.resolver';
import jwtConfig from './jwt.config';
import { AuthService } from './services/auth/auth.service';

@Module({
    imports: [
        PassportModule,
        JwtModule.register(jwtConfig)
    ],
    providers: [AuthResolver, AuthService]
})
export class AuthModule {}
