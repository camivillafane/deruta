import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomInt } from 'crypto';
import { UsersService } from '../users/users.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import { VerifyCodeDto, VerifyIdentityDto, ResendCodeDto } from './dto/verification.dto.js';

export interface TokenPayload {
  sub: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse & { emailVerificationCode?: string; phoneVerificationCode?: string }> {
    const passwordHash = await hash(dto.password, 12);
    const user = await this.usersService.create({
      name: dto.name,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
    });

    const codes = this.generateVerificationCodes();
    await this.usersService.setVerificationCodes(user.id, codes);

    await this.sendVerificationCodes(user.email, user.phone, codes);

    return {
      ...this.generateTokens(user),
      emailVerificationCode: this.isDev() ? codes.emailVerificationCode : undefined,
      phoneVerificationCode: this.isDev() ? codes.phoneVerificationCode : undefined,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithCredentials(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    const user = await this.usersService.findByIdWithCredentials(payload.sub);
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const valid = await compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private async generateTokens(user: Awaited<ReturnType<typeof this.usersService.findById>>): Promise<AuthResponse> {
    const payload: TokenPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as JwtSignOptions['expiresIn'],
    });

    await this.usersService.setRefreshTokenHash(
      user.id,
      await hash(refreshToken, 12),
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async verifyEmail(userId: string, dto: VerifyCodeDto): Promise<void> {
    const user = await this.usersService.findByIdWithCredentials(userId);
    if (user.emailVerified) {
      return;
    }
    if (!user.emailVerificationCode || user.emailVerificationCode !== dto.code) {
      throw new UnauthorizedException('Código incorrecto');
    }
    if (user.emailVerificationExpiresAt && new Date() > new Date(user.emailVerificationExpiresAt)) {
      throw new UnauthorizedException('El código expiró');
    }
    await this.usersService.verifyEmail(userId);
  }

  async resendEmailVerification(userId: string): Promise<{ emailVerificationCode?: string }> {
    const user = await this.usersService.findById(userId);
    if (user.emailVerified) {
      return {};
    }
    const code = this.generateCode();
    const expiresAt = this.expiresAt();
    await this.usersService.setVerificationCodes(userId, {
      emailVerificationCode: code,
      emailVerificationExpiresAt: expiresAt,
    });
    await this.sendVerificationCodes(user.email, undefined, {
      emailVerificationCode: code,
      emailVerificationExpiresAt: expiresAt,
    });
    return { emailVerificationCode: this.isDev() ? code : undefined };
  }

  async verifyPhone(userId: string, dto: VerifyCodeDto): Promise<void> {
    const user = await this.usersService.findByIdWithCredentials(userId);
    if (user.phoneVerified) {
      return;
    }
    if (!user.phoneVerificationCode || user.phoneVerificationCode !== dto.code) {
      throw new UnauthorizedException('Código incorrecto');
    }
    if (user.phoneVerificationExpiresAt && new Date() > new Date(user.phoneVerificationExpiresAt)) {
      throw new UnauthorizedException('El código expiró');
    }
    await this.usersService.verifyPhone(userId);
  }

  async resendPhoneVerification(userId: string): Promise<{ phoneVerificationCode?: string }> {
    const user = await this.usersService.findById(userId);
    if (user.phoneVerified || !user.phone) {
      return {};
    }
    const code = this.generateCode();
    const expiresAt = this.expiresAt();
    await this.usersService.setVerificationCodes(userId, {
      phoneVerificationCode: code,
      phoneVerificationExpiresAt: expiresAt,
    });
    await this.sendVerificationCodes(undefined, user.phone, {
      phoneVerificationCode: code,
      phoneVerificationExpiresAt: expiresAt,
    });
    return { phoneVerificationCode: this.isDev() ? code : undefined };
  }

  async submitIdentity(userId: string, dto: VerifyIdentityDto): Promise<void> {
    await this.usersService.submitIdentity(userId, dto);
    if (this.isDev()) {
      await this.usersService.approveIdentity(userId);
    }
  }

  private generateVerificationCodes() {
    return {
      emailVerificationCode: this.generateCode(),
      emailVerificationExpiresAt: this.expiresAt(),
      phoneVerificationCode: this.generateCode(),
      phoneVerificationExpiresAt: this.expiresAt(),
    };
  }

  private generateCode(): string {
    return String(randomInt(100000, 1000000));
  }

  private expiresAt(): Date {
    const minutes = parseInt(this.configService.get<string>('VERIFICATION_CODE_EXPIRATION_MINUTES', '30'), 10);
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private async sendVerificationCodes(
    email?: string,
    phone?: string,
    codes?: Partial<ReturnType<typeof this.generateVerificationCodes>>,
  ): Promise<void> {
    if (this.isDev()) {
      console.log('[DEV] Verification codes:', { email, phone, ...codes });
      return;
    }
    // TODO: integrar SendGrid/Resend para email y Twilio para SMS
  }

  private isDev(): boolean {
    return this.configService.get<string>('NODE_ENV', 'development') !== 'production';
  }
}
