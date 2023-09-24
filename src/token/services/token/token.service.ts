import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenService {
    private revokedTokens: string[] = [];

    public revokeToken(token: string): void {
        this.revokedTokens.push(token);
    }

    public isTokenRevoked(token: string): boolean {
        return this.revokedTokens.includes(token);
    }
}
