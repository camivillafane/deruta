import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

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

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await hash(dto.password, 12);
    const user = await this.usersService.create({
      name: dto.name,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
    });

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
}
