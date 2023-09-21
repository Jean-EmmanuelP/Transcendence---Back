import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthResolver } from './resolvers/auth/auth.resolver';
import jwtConfig from './jwt.config';
import { AuthService } from './services/auth/auth.service';
import { UserService } from 'src/user/services/user/user.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [
        PassportModule,
        JwtModule.register(jwtConfig),
        PrismaModule
    ],
    providers: [JwtService, AuthResolver, AuthService, UserService]
})
export class AuthModule {}
