import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import jwtConfig from './jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConfig.secret,
        });
        console.log("Secret dans JwtStrategy:", jwtConfig.secret);
    }

    async validate(payload: any) {
        console.log("Decoded JWT payload:", payload);
        return { userId: payload.userId, email: payload.email };
    }
}