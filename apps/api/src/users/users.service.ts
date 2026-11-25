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
  emailVerificationCode?: string;
  emailVerificationExpiresAt?: Date;
  phoneVerificationCode?: string;
  phoneVerificationExpiresAt?: Date;
}

export interface IdentityData {
  dni: string;
  licenseNumber: string;
  licenseFrontImage: string;
  licenseBackImage: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailWithCredentials(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .addSelect('user.refreshTokenHash')
      .where('user.email = :email', { email })
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
      .where('user.id = :id', { id })
      .getOne();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async setRefreshTokenHash(id: string, refreshTokenHash: string | null): Promise<void> {
    await this.userRepository.update(id, { refreshTokenHash: refreshTokenHash || undefined });
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
    await this.userRepository.update(id, codes);
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
