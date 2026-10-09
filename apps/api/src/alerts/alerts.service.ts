import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../entities/index.js';
import { CreateAlertDto } from './dto/alert.dto.js';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  async create(userId: string, dto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create({
      ...dto,
      userId,
      date: new Date(dto.date),
      active: true,
    });
    return this.alertRepository.save(alert);
  }

  async findByUser(userId: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deactivate(id: string, userId: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id, userId } });
    if (!alert) {
      throw new NotFoundException('Alerta no encontrada');
    }
    alert.active = false;
    return this.alertRepository.save(alert);
  }

  async findMatchingAlerts(origin: string, destination: string, date: Date): Promise<Alert[]> {
    return this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.user', 'user')
      .where('alert.active = :active', { active: true })
      .andWhere('LOWER(alert.origin) = LOWER(:origin)', { origin })
      .andWhere('LOWER(alert.destination) = LOWER(:destination)', { destination })
      .andWhere('alert.date = :date', { date })
      .getMany();
  }
}
