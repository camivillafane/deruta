import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto/auth.dto.js';
import { VerifyCodeDto, VerifyIdentityDto } from './dto/verification.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyEmail(@CurrentUser('userId') userId: string, @Body() dto: VerifyCodeDto) {
    return this.authService.verifyEmail(userId, dto);
  }

  @Post('resend-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  resendEmail(@CurrentUser('userId') userId: string) {
    return this.authService.resendEmailVerification(userId);
  }

  @Post('verify-phone')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyPhone(@CurrentUser('userId') userId: string, @Body() dto: VerifyCodeDto) {
    return this.authService.verifyPhone(userId, dto);
  }

  @Post('resend-phone')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  resendPhone(@CurrentUser('userId') userId: string) {
    return this.authService.resendPhoneVerification(userId);
  }

  @Post('verify-identity')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyIdentity(@CurrentUser('userId') userId: string, @Body() dto: VerifyIdentityDto) {
    return this.authService.submitIdentity(userId, dto);
  }

  @Get('verification-status')
  @UseGuards(JwtAuthGuard)
  verificationStatus(@CurrentUser('userId') userId: string) {
    return this.authService.validateUser(userId);
  }
}
