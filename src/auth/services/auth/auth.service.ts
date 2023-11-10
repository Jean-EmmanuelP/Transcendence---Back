import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/services/user/user.service";
import { ConfigService } from "@nestjs/config";
import { RegisterDto } from "src/auth/dto/register.input";
import * as bcrypt from "bcrypt";
import { LoginDto } from "src/auth/dto/login.input";
import { AuthOutput } from "src/auth/dto/auth.input";

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private jwtService: JwtService,
		private readonly userService: UserService
	) { }
	//typer pour google et 42
	async OauthLogin(req, oauthService: "google" | "42"): Promise<AuthOutput> {
		if (!req.user) {
			return {
				message: 'User is undefined!',
				user: req.user,
				access_token: "undefined",
			};
		}

		// eviter les let sans les definir
		let user;

		// const user = oauthService === "google" ? this.OauthLoginGoogle(...) : this.OauthLogin42(...)

		if (oauthService === "google") {
			const { email, firstName, lastName, picture, accessToken } = req.user;
			const avatar = picture || "/src/common/images/avatar_default.gif";
			user = await this.userService.upsertOAuthUser({
				email,
				firstName,
				lastName,
				avatar,
				accessToken,
			});
		} else {
			const {
				email,
				first_name: firstName,
				last_name: lastName,
				image,
				accessToken,
			} = req.user.apiData;
			const avatarLink = image?.link;
			if (!avatarLink) {
				throw new Error("42 User data doesn't have an image link");
			}
			user = await this.userService.upsertOAuthUser({
				email,
				firstName,
				lastName,
				avatar: avatarLink,
				accessToken,
			});
		}
		let jwtToken:string = "";
		if (user.isTwoFactorEnabled)
			jwtToken = this.jwtService.sign(
				{ userId: user.id, email: user.email, pseudo: user.pseud, isTemporary: true },
				{ secret: process.env.JWT_SECRET }
			);
		else
			jwtToken = this.jwtService.sign(
				{ userId: user.id, email: user.email, pseudo: user.pseudo },
				{ secret: process.env.JWT_SECRET }
			);

		return {
			message: "User information saved in the database",
			user: user,
			access_token: jwtToken,
		};
	}

	async register(registerDto: RegisterDto) {
		return this.userService.register(registerDto);
	}

	async validateUserCredentials(loginDto: LoginDto) {
		return this.userService.validateUserCredentials(loginDto);
	}

	async validateTwoFactorCode(token: string, twofactorcode: string) {
		return this.userService.validateTwoFactorCode(token, twofactorcode);
	}

	async generateTwoFactorSecret(userId: string) {
		return this.userService.generateTwoFactorSecret(userId);
	}

	async verifyTwoFactorToken(userId: string, token: string) {
		return this.userService.verifyTwoFactorToken(userId, token);
	}

	async disable2FA(userId: string) {
		return this.userService.disable2FA(userId);
	}
}
