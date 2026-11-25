import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserReport, UserReportStatus } from '../entities/index.js';

export interface CreateReportData {
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(UserReport)
    private readonly reportRepository: Repository<UserReport>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(data: CreateReportData): Promise<UserReport> {
    if (data.reporterId === data.reportedUserId) {
      throw new BadRequestException('No podés reportarte a vos mismo');
    }

    const reportedUser = await this.userRepository.findOne({ where: { id: data.reportedUserId } });
    if (!reportedUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const report = this.reportRepository.create({
      ...data,
      status: UserReportStatus.PENDING,
    });

    return this.reportRepository.save(report);
  }

  async findPending(): Promise<UserReport[]> {
    return this.reportRepository.find({
      where: { status: UserReportStatus.PENDING },
      relations: { reporter: true, reportedUser: true },
      order: { createdAt: 'DESC' },
    });
  }

  async blockUser(reportedUserId: string, reason?: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: reportedUserId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.isBlocked = true;
    user.blockedReason = reason;
    user.blockedAt = new Date();
    return this.userRepository.save(user);
  }

  async unblockUser(reportedUserId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: reportedUserId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.isBlocked = false;
    user.blockedReason = undefined;
    user.blockedAt = undefined;
    return this.userRepository.save(user);
  }

  async resolveReport(id: string, adminNotes?: string): Promise<UserReport> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }
    report.status = UserReportStatus.RESOLVED;
    report.adminNotes = adminNotes;
    return this.reportRepository.save(report);
  }

  async dismissReport(id: string, adminNotes?: string): Promise<UserReport> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }
    report.status = UserReportStatus.DISMISSED;
    report.adminNotes = adminNotes;
    return this.reportRepository.save(report);
  }
}
