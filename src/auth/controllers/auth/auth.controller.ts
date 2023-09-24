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

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("google")
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Request() req) {}

  @Get("google-redirect")
  @UseGuards(GoogleOAuthGuard)
  googleAuthRedirect(@Request() req) {
    return this.authService.OauthLogin(req, "google");
  }

  @Get("42")
  @UseGuards(FortyTwoGuard)
  async fortyTwoAuth(@Request() req) {}

  @Get("42-redirect")
  @UseGuards(FortyTwoGuard)
  async fortyTwoAuthRedirect(@Request() req, @Res() res) {
    const user = await this.authService.OauthLogin(req, "42");
    //pq res ca fonctionne et sans res ca fonctionne pas
    return res.send(user);
  }

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.validateUser(loginDto);
  }

  @Post("generate-qrcode")
  @UseGuards(JwtAuthGuard)
  async enableTwoFactor(@Request() req) {
    const userId = req.user.userId;
    const qrCodeUrl = await this.authService.generateTwoFactorSecret(userId);
    return { qrCodeUrl };
  }

  @Post("verify-two-factor")
  @UseGuards(JwtAuthGuard)
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
}
