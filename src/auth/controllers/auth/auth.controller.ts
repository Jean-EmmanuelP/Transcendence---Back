import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "src/auth/services/auth/auth.service";
import { GoogleOAuthGuard } from "../../../guards/google-oauth.guard";
import { FortyTwoGuard } from "../../../guards/forty-two.guard";
import { RegisterDto } from "src/auth/dto/register.input";
import { LoginDto } from "src/auth/dto/login.input";
import { JwtAuthGuard } from "src/guards/jwt.guard";
import { TokenService } from "src/token/services/token/token.service";
import { JwtService } from "@nestjs/jwt";
import { sign, verify } from "jsonwebtoken";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from "@nestjs/swagger";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService
  ) {}

  @Get("google")
  @ApiOperation({ summary: "Get the google authentication" })
  @ApiResponse({
    status: 200,
    description:
      "Will redirect you to the endpoint google-redirect then send you back a message, user information and an accessToken which is the jwtToken of the user",
  })
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Request() req) {}

  @Get("google-redirect")
  @ApiOperation({
    summary: "linked to the /google endpoint, so you dont need to use it",
  })
  @UseGuards(GoogleOAuthGuard)
  googleAuthRedirect(@Request() req) {
    return this.authService.OauthLogin(req, "google");
  }

  @Get("42")
  @ApiOperation({ summary: "Get the 42 authentication " })
  @ApiResponse({
    status: 200,
    description:
      "Will redirect you to the endpoint 42-redirect then send you back a message, user information and an accessToken which is the jwtToken of the user",
  })
  @UseGuards(FortyTwoGuard)
  async fortyTwoAuth(@Request() req) {}

  @Get("42-redirect")
  @ApiOperation({
    summary: "linked to the /google endpoint, so you dont need to use it",
  })
  @UseGuards(FortyTwoGuard)
  async fortyTwoAuthRedirect(@Request() req, @Res() res) {
    const user = await this.authService.OauthLogin(req, "42");
    //pq res ca fonctionne et sans res ca fonctionne pas
    return res.send(user);
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

  @Post("login")
  @ApiOperation({ summary: "Used to login" })
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
    description:
      "return json with user info (name, avatar, email) and accessToken",
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.validateUser(loginDto);
  }

  @Post("enable-two-factor")
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbG15b2luODAwMDAwOXl1MDlid2Qwa2p1IiwiZW1haWwiOiJiZXJuYXJkQHRhcGllLmNvbSIsImlhdCI6MTY5NTYzNzM1NH0.EqozSPYc_R9bQb_JGgqY49FTy-E9wSek03RuobsQJ78'
  })
  @ApiOperation({
    summary: "it is used to generate the qrcode so the two-factor is enabled",
  })
  @ApiResponse({
    status: 200,
    description:
      "return a qrcode link, you will need to copy it and paste it as a variable to the image in the front",
  })
  @UseGuards(JwtAuthGuard)
  async enableTwoFactor(@Request() req) {
    const userId = req.user.userId;
    const qrCodeUrl = await this.authService.generateTwoFactorSecret(userId);
    return { qrCodeUrl };
  }

  @Post("verify-two-factor")
  @ApiOperation({
    summary:
      "after scanning the qrcode, we check if the password is good with the encrypted secret saved in the db",
  })
  @ApiResponse({
    status: 200,
    description: "return a boolean : true or false",
  })
  async verifyTwoFactor(@Request() req, @Body() body) {
    const { code } = body;
    const userId = req.user.userId;
    const isVerified = await this.authService.verifyTwoFactorToken(
      userId,
      code
    );
    if (!isVerified) {
      throw new UnauthorizedException("Invalid two factor code");
    }
    return { message: "Two factor authentication has been enabled" };
  }

  @Post("logout")
  @ApiOperation({
    summary: "the logout button will blacklist the current token",
  })
  @ApiResponse({
    description: "will return an expired token + a message",
  })
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    const token = req.headers.authorization.split(" ")[1];
    console.log(`This is the actual token you are revoking:`, token);
    this.tokenService.revokeToken(token);
    const expiredToken = verify(token, process.env.JWT_SECRET) as {
      [key: string]: any;
    };
    expiredToken.exp = 0;

    const newToken = sign(expiredToken, process.env.JWT_SECRET);
    return { token: newToken, message: "Logged out successfully" };
  }
}
