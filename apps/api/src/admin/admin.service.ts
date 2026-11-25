import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from '../entities/index.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findPendingIdentityVerifications(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        emailVerified: true,
        phoneVerified: true,
        identitySubmittedAt: Not(IsNull()),
        identityVerified: false,
      },
      order: { identitySubmittedAt: 'ASC' },
    });
  }

  async approveIdentity(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.identityVerified = true;
    user.identityVerifiedAt = new Date();
    return this.userRepository.save(user);
  }

  async rejectIdentity(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.identitySubmittedAt = undefined;
    user.identityVerified = false;
    return this.userRepository.save(user);
  }
}
