import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRequestsController } from './trip-requests.controller.js';
import { TripRequestsService } from './trip-requests.service.js';
import { TripRequest } from '../entities/index.js';
import { Trip } from '../entities/index.js';
import { Conversation } from '../entities/index.js';
import { CommonModule } from '../common/common.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([TripRequest, Trip, Conversation]), CommonModule],
  controllers: [TripRequestsController],
  providers: [TripRequestsService],
  exports: [TripRequestsService],
})
export class TripRequestsModule {}
