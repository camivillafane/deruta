import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service.js';
import { ReportsController, AdminUsersController } from './reports.controller.js';
import { User, UserReport } from '../entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserReport, User])],
  controllers: [ReportsController, AdminUsersController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
