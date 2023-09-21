import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthResolver } from './resolvers/auth/auth.resolver';
import jwtConfig from './jwt.config';
import { AuthService } from './services/auth/auth.service';
import { UserService } from 'src/user/services/user/user.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './controllers/auth/auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { ConfigModule } from '@nestjs/config';
import { FortyTwoAuthStrategy } from './strategies/42.strategy';

@Module({
    imports: [
        ConfigModule.forRoot(),
        PassportModule,
        JwtModule.register(jwtConfig),
        PrismaModule
    ],
    providers: [JwtService, AuthResolver, AuthService, UserService, GoogleStrategy, FortyTwoAuthStrategy],
    controllers: [AuthController]
})
export class AuthModule {}