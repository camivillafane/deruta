import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from '../entities/index.js';
import { IdentityDocumentsService } from '../common/services/identity-documents.service.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly identityDocuments: IdentityDocumentsService,
  ) {}

  /** Foto de la licencia de un usuario (solo admin). */
  async getIdentityDocument(userId: string, side: 'front' | 'back') {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.identityDocuments.read(side === 'front' ? user.licenseFrontImage : user.licenseBackImage);
  }

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
    // null (no undefined): con undefined TypeORM no tocaba la columna y la solicitud
    // seguía figurando como enviada. Se borran también las fotos.
    await this.identityDocuments.remove(user.licenseFrontImage);
    await this.identityDocuments.remove(user.licenseBackImage);
    user.identitySubmittedAt = null as unknown as Date;
    user.licenseFrontImage = null as unknown as string;
    user.licenseBackImage = null as unknown as string;
    user.identityVerified = false;
    return this.userRepository.save(user);
  }
}
