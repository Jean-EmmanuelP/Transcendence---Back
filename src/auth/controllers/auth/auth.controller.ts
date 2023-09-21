import { Controller, Get, Request, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "src/auth/services/auth/auth.service";
import { GoogleOAuthGuard } from "../../../guards/google-oauth.guard";
import { FortyTwoGuard } from "../../../guards/forty-two.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("google")
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Request() req) {}

  @Get("google-redirect")
  @UseGuards(GoogleOAuthGuard)
  googleAuthRedirect(@Request() req) {
    return this.authService.OauthLogin(req, 'google');
  }

  @Get("42")
  @UseGuards(FortyTwoGuard)
  async fortyTwoAuth(@Request() req) {}

  @Get("42-redirect")
  @UseGuards(FortyTwoGuard)
  async fortyTwoAuthRedirect(@Request() req, @Res() res) {
    const user = await this.authService.fortyTwoLogin(req);
    res.send(user);
  } 
}
