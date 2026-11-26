import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/index.js';

export interface CreateUserData {
  name: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
  city?: string;
}

export interface VerificationCodes {
  emailVerificationCode?: string | null;
  emailVerificationExpiresAt?: Date;
  emailVerificationAttempts?: number;
  phoneVerificationCode?: string | null;
  phoneVerificationExpiresAt?: Date;
  phoneVerificationAttempts?: number;
}

export interface IdentityData {
  dni: string;
  licenseNumber: string;
  licenseFrontImage: string;
  licenseBackImage: string;
}

/** Emails sin espacios y en minúsculas: Martin@x.com y martin@x.com son la misma cuenta. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    data = { ...data, email: normalizeEmail(data.email) };
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    // LOWER() para encontrar también cuentas viejas guardadas con mayúsculas.
    return this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: normalizeEmail(email) })
      .getOne();
  }

  async findByEmailWithCredentials(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .addSelect('user.refreshTokenHash')
      .where('LOWER(user.email) = :email', { email: normalizeEmail(email) })
      .getOne();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByIdWithCredentials(id: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .addSelect('user.refreshTokenHash')
      .addSelect('user.emailVerificationCode')
      .addSelect('user.phoneVerificationCode')
      .addSelect('user.emailVerificationAttempts')
      .addSelect('user.phoneVerificationAttempts')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.findById(id);
    // Un teléfono nuevo hay que volver a verificarlo.
    if (data.phone !== undefined && data.phone !== user.phone) {
      user.phoneVerified = false;
    }
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async setPasswordResetToken(id: string, tokenHash: string | null, expiresAt: Date | null): Promise<void> {
    await this.userRepository.update(id, {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    } as Partial<User>);
  }

  async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordResetTokenHash')
      .addSelect('user.passwordResetExpiresAt')
      .where('user.passwordResetTokenHash = :tokenHash', { tokenHash })
      .getOne();
  }

  /** Cambia la contraseña, invalida el link usado y cierra todas las sesiones abiertas. */
  async resetPassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(id, {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      refreshTokenHash: null,
    } as unknown as Partial<User>);
  }

  async setRefreshTokenHash(id: string, refreshTokenHash: string | null): Promise<void> {
    // null (no undefined): con undefined TypeORM no tocaba la columna y el logout
    // no invalidaba el refresh token.
    await this.userRepository.update(id, { refreshTokenHash: refreshTokenHash as string });
  }

  async updateRating(userId: string): Promise<void> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('AVG(rating.score)', 'average')
      .addSelect('COUNT(rating.id)', 'count')
      .leftJoin('user.ratingsReceived', 'rating')
      .where('user.id = :userId', { userId })
      .getRawOne();

    const average = result.average ? parseFloat(result.average) : 0;
    const count = parseInt(result.count, 10) || 0;

    await this.userRepository.update(userId, {
      rating: Math.round(average * 10) / 10,
      totalTrips: count,
    });
  }

  async setVerificationCodes(id: string, codes: VerificationCodes): Promise<void> {
    await this.userRepository.update(id, codes as Partial<User>);
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userRepository.update(id, {
      emailVerified: true,
      emailVerificationCode: null as any,
      emailVerificationExpiresAt: null as any,
    });
  }

  async verifyPhone(id: string): Promise<void> {
    await this.userRepository.update(id, {
      phoneVerified: true,
      phoneVerificationCode: null as any,
      phoneVerificationExpiresAt: null as any,
    });
  }

  async submitIdentity(id: string, data: IdentityData): Promise<void> {
    await this.userRepository.update(id, {
      ...data,
      identitySubmittedAt: new Date(),
    });
  }

  async approveIdentity(id: string): Promise<void> {
    await this.userRepository.update(id, {
      identityVerified: true,
      identityVerifiedAt: new Date(),
    });
  }
}
