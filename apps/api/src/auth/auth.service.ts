import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomInt } from 'crypto';
import { UsersService } from '../users/users.service.js';
import type { User } from '../entities/index.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import { VerifyCodeDto, VerifyIdentityDto } from './dto/verification.dto.js';
import { EmailServiceFactory } from '../common/services/email.service.js';
import { SmsServiceFactory } from '../common/services/sms.service.js';

export type TokenType = 'access' | 'refresh';

export interface TokenPayload {
  sub: string;
  email: string;
  /** Tipo de token: un refresh token no sirve para llamar a la API, y viceversa. */
  typ?: TokenType;
}

/** Intentos fallidos permitidos por código de verificación antes de invalidarlo. */
export const MAX_VERIFICATION_ATTEMPTS = 5;

export type PublicUser = Omit<
  User,
  | 'passwordHash'
  | 'refreshTokenHash'
  | 'emailVerificationCode'
  | 'phoneVerificationCode'
  | 'emailVerificationAttempts'
  | 'phoneVerificationAttempts'
>;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailServiceFactory: EmailServiceFactory,
    private readonly smsServiceFactory: SmsServiceFactory,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
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

    // La cuenta ya está creada: si el proveedor de email/SMS falla, no devolver error
    // (la persona puede pedir el código de nuevo desde la pantalla de verificación).
    try {
      await this.sendVerificationCodes(user.email, user.phone, codes);
    } catch (error) {
      console.error('No se pudieron enviar los códigos de verificación:', error);
    }

    return this.generateTokens(user);
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

    if (user.isBlocked) {
      throw new UnauthorizedException(user.blockedReason || 'Tu cuenta ha sido bloqueada. Contactá al soporte.');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Sesión inválida');
    }
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Sesión inválida');
    }

    const user = await this.usersService.findByIdWithCredentials(payload.sub).catch(() => null);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Sesión inválida');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException(user.blockedReason || 'Tu cuenta ha sido bloqueada. Contactá al soporte.');
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

  private sanitizeUser(user: User): PublicUser {
    const {
      passwordHash,
      refreshTokenHash,
      emailVerificationCode,
      phoneVerificationCode,
      emailVerificationAttempts,
      phoneVerificationAttempts,
      ...publicUser
    } = user;
    return publicUser;
  }

  private async generateTokens(user: User): Promise<AuthResponse> {
    const payload: TokenPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign({ ...payload, typ: 'access' }, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = this.jwtService.sign({ ...payload, typ: 'refresh' }, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as JwtSignOptions['expiresIn'],
    });

    await this.usersService.setRefreshTokenHash(
      user.id,
      await hash(refreshToken, 12),
    );

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
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
    if (!user.emailVerificationCode) {
      throw new UnauthorizedException('Pedí un código nuevo');
    }
    if (user.emailVerificationCode !== dto.code) {
      await this.registerFailedAttempt(userId, 'email', user.emailVerificationAttempts ?? 0);
      throw new UnauthorizedException('Código incorrecto');
    }
    if (user.emailVerificationExpiresAt && new Date() > new Date(user.emailVerificationExpiresAt)) {
      throw new UnauthorizedException('El código expiró');
    }
    await this.usersService.verifyEmail(userId);
  }

  async resendEmailVerification(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user.emailVerified) {
      return;
    }
    const code = this.generateCode();
    const expiresAt = this.expiresAt();
    await this.usersService.setVerificationCodes(userId, {
      emailVerificationCode: code,
      emailVerificationExpiresAt: expiresAt,
      emailVerificationAttempts: 0,
    });
    await this.sendVerificationCodes(user.email, undefined, {
      emailVerificationCode: code,
      emailVerificationExpiresAt: expiresAt,
    });
  }

  async verifyPhone(userId: string, dto: VerifyCodeDto): Promise<void> {
    const user = await this.usersService.findByIdWithCredentials(userId);
    if (user.phoneVerified) {
      return;
    }
    if (!user.phoneVerificationCode) {
      throw new UnauthorizedException('Pedí un código nuevo');
    }
    if (user.phoneVerificationCode !== dto.code) {
      await this.registerFailedAttempt(userId, 'phone', user.phoneVerificationAttempts ?? 0);
      throw new UnauthorizedException('Código incorrecto');
    }
    if (user.phoneVerificationExpiresAt && new Date() > new Date(user.phoneVerificationExpiresAt)) {
      throw new UnauthorizedException('El código expiró');
    }
    await this.usersService.verifyPhone(userId);
  }

  async resendPhoneVerification(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user.phoneVerified || !user.phone) {
      return;
    }
    const code = this.generateCode();
    const expiresAt = this.expiresAt();
    await this.usersService.setVerificationCodes(userId, {
      phoneVerificationCode: code,
      phoneVerificationExpiresAt: expiresAt,
      phoneVerificationAttempts: 0,
    });
    await this.sendVerificationCodes(undefined, user.phone, {
      phoneVerificationCode: code,
      phoneVerificationExpiresAt: expiresAt,
    });
  }

  async submitIdentity(userId: string, dto: VerifyIdentityDto): Promise<void> {
    await this.usersService.submitIdentity(userId, dto);
    const storageProvider = this.configService.get<string>('STORAGE_PROVIDER', 'local');
    if (storageProvider === 'local') {
      await this.usersService.approveIdentity(userId);
    }
  }

  /**
   * Cuenta un intento fallido. Al llegar al máximo invalida el código, así no se
   * pueden probar los 6 dígitos por fuerza bruta: hay que pedir uno nuevo.
   */
  private async registerFailedAttempt(userId: string, channel: 'email' | 'phone', previous: number): Promise<void> {
    const attempts = previous + 1;
    if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await this.usersService.setVerificationCodes(
        userId,
        channel === 'email'
          ? { emailVerificationCode: null, emailVerificationAttempts: 0 }
          : { phoneVerificationCode: null, phoneVerificationAttempts: 0 },
      );
      throw new UnauthorizedException('Demasiados intentos. Pedí un código nuevo.');
    }
    await this.usersService.setVerificationCodes(
      userId,
      channel === 'email' ? { emailVerificationAttempts: attempts } : { phoneVerificationAttempts: attempts },
    );
  }

  private generateVerificationCodes() {
    return {
      emailVerificationCode: this.generateCode(),
      emailVerificationExpiresAt: this.expiresAt(),
      emailVerificationAttempts: 0,
      phoneVerificationCode: this.generateCode(),
      phoneVerificationExpiresAt: this.expiresAt(),
      phoneVerificationAttempts: 0,
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
    const emailService = this.emailServiceFactory.create();
    const smsService = this.smsServiceFactory.create();

    if (email && codes?.emailVerificationCode) {
      await emailService.send({
        to: email,
        subject: 'Tu código de verificación - DE RUTA',
        text: `Tu código para verificar tu email es: ${codes.emailVerificationCode}. Vence en ${this.configService.get('VERIFICATION_CODE_EXPIRATION_MINUTES', '30')} minutos.`,
        html: `<p>Tu código para verificar tu email es: <strong>${codes.emailVerificationCode}</strong></p><p>Vence en ${this.configService.get('VERIFICATION_CODE_EXPIRATION_MINUTES', '30')} minutos.</p>`,
      });
    }

    if (phone && codes?.phoneVerificationCode) {
      await smsService.send({
        to: phone,
        body: `Tu código de verificación de DE RUTA es: ${codes.phoneVerificationCode}. Vence en ${this.configService.get('VERIFICATION_CODE_EXPIRATION_MINUTES', '30')} minutos.`,
      });
    }
  }
}
