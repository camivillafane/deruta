import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';
import { VerifyCodeDto, VerifyIdentityDto } from './dto/verification.dto.js';
import { BadRequestException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_IDENTITY_DOCUMENT_BYTES } from '../common/services/identity-documents.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // Responde siempre igual, exista o no la cuenta, para no revelar qué emails están registrados.
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'Si el email está registrado, te enviamos un link para cambiar la contraseña.' };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId);
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyEmail(@CurrentUser('userId') userId: string, @Body() dto: VerifyCodeDto) {
    return this.authService.verifyEmail(userId, dto);
  }

  @Post('resend-email')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  resendEmail(@CurrentUser('userId') userId: string) {
    return this.authService.resendEmailVerification(userId);
  }

  @Post('verify-phone')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyPhone(@CurrentUser('userId') userId: string, @Body() dto: VerifyCodeDto) {
    return this.authService.verifyPhone(userId, dto);
  }

  @Post('resend-phone')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  resendPhone(@CurrentUser('userId') userId: string) {
    return this.authService.resendPhoneVerification(userId);
  }

  /** Sube UNA foto de la licencia (campo multipart 'file') y devuelve su clave. */
  @Post('identity-documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IDENTITY_DOCUMENT_BYTES, files: 1 } }))
  async uploadIdentityDocument(@UploadedFile() file?: { buffer: Buffer }) {
    if (!file?.buffer) {
      throw new BadRequestException('Falta la foto');
    }
    return { key: await this.authService.uploadIdentityDocument(file.buffer) };
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
