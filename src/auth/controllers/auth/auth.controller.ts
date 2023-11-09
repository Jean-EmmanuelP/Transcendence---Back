import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "src/auth/services/auth/auth.service";
import { GoogleOAuthGuard } from "../../../guards/google-oauth.guard";
import { FortyTwoGuard } from "../../../guards/forty-two.guard";
import { RegisterDto } from "src/auth/dto/register.input";
import { LoginDto } from "src/auth/dto/login.input";
import { JwtAuthGuard } from "src/guards/jwt.guard";
import { TokenService } from "src/token/services/token/token.service";
import { sign, verify } from "jsonwebtoken";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService
  ) { }

  @Get("google")
  @ApiOperation({ summary: "Get the google authentication" })
  @ApiResponse({
    status: 200,
    description:
      "Will redirect you to the endpoint google-redirect then send you back a message, user information and an accessToken which is the jwtToken of the user",
  })
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Request() req) { }

  @Get("google-redirect")
  @ApiOperation({
    summary: "linked to the /google endpoint, so you dont need to use it",
  })
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Request() req, @Res() res) {
    const user = await this.authService.OauthLogin(req, "google");
    if (user.access_token === "undefined") {
      throw new Error("The google response is not working!");
    }
    res.cookie("access_token", user.access_token, {
      httpOnly: false,
      secure: false,
    });
    if (user.user.isTwoFactorEnabled)
      res.redirect(process.env.REDIRECT_URL_FRONT + "/2fa");
    else
      res.redirect(process.env.REDIRECT_URL_FRONT);
  }

  @Get("42")
  @ApiOperation({ summary: "Get the 42 authentication " })
  @ApiResponse({
    status: 200,
    description:
      "Will redirect you to the endpoint 42-redirect then send you back a message, user information and an accessToken which is the jwtToken of the user",
  })
  @UseGuards(FortyTwoGuard)
  async fortyTwoAuth(@Request() req) { }

  @Get("42-redirect")
  @ApiOperation({
    summary: "linked to the /google endpoint, so you dont need to use it",
  })
  @UseGuards(FortyTwoGuard)
  async fortyTwoAuthRedirect(@Request() req, @Res() res) {
    // console.log("USEEEER")
    const user = await this.authService.OauthLogin(req, "42");
    if (user.access_token === "undefined") {
      throw new Error("The forty-two response is not working!");
    }

	res.cookie("access_token", user.access_token, {
		httpOnly: false,
		secure: false,
	});
	if (user.user.isTwoFactorEnabled === true)
		res.redirect(process.env.REDIRECT_URL_FRONT + "/2fa");
	else
    	res.redirect(process.env.REDIRECT_URL_FRONT);

  }

  @Post("register")
  @ApiOperation({
    summary: "Endpoint to register the user",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        password: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string", format: "email" },
      },
      required: ["password", "email", "firstName", "lastName"],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      "will return a json with message, and user information (name, avatar and email) and an accessToken",
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("loginCredentials")
  @ApiOperation({
    summary: "Used to login (can be first step if the user activated the 2FA)",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        password: { type: "string" },
        email: { type: "string", format: "email" },
      },
      required: ["password", "email"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "return token and twoFactorEnable which is a boolean",
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.validateUserCredentials(loginDto);
  }

  @Post("loginVia2FA")
  @ApiOperation({
    summary:
      "this endpoint is responsible of checking the 2FA TOTP (the code from google authenticator)",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        token: { type: "string" },
        twofactorcode: { type: "string" },
      },
      required: ["twofactorcode", "token"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "return the access token",
  })
  async verifyTwoFactor(@Request() req, @Body() body) {
    const { twofactorcode, token } = body;
    return this.authService.validateTwoFactorCode(token, twofactorcode);
  }

  @Post("enable-two-factor")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "activate the 2FA + return qrcode",
  })
  @ApiResponse({
    status: 200,
    description:
      "return a qrcode link, you will need to copy it and paste it as a variable to the image in the front",
  })
  @ApiBearerAuth("Authorization")
  async enableTwoFactor(@Request() req) {
    const userId = req.user.userId;
    const qrCodeUrl = await this.authService.generateTwoFactorSecret(userId);
    return { qrCodeUrl };
  }

  @Post("disable-two-factor")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "disable the 2fa" })
  @ApiResponse({ status: 200, description: "return a message of success" })
  @ApiBearerAuth("Authorization")
  async disableTwoFactor(@Request() req) {
    const userId = req.user.userId;
    await this.authService.disable2FA(userId);
    return { message: "Two factor authentication has been disabled" };
  }

  @Post("logout")
  @ApiOperation({
    summary: "the logout button will blacklist the current token",
  })
  @ApiResponse({
    description: "will return an expired token + a message",
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("Authorization")
  async logout(@Request() req) {
    const token = req.headers.authorization.split(" ")[1];
    // console.log(`This is the actual token you are revoking:`, token);
    this.tokenService.revokeToken(token);
    const expiredToken = verify(token, process.env.JWT_SECRET) as {
      [key: string]: any;
    };
    expiredToken.exp = 0;

    const newToken = sign(expiredToken, process.env.JWT_SECRET);
    return { token: newToken, message: "Logged out successfully" };
  }
}
