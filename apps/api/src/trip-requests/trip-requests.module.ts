import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRequestsController } from './trip-requests.controller.js';
import { TripRequestsService } from './trip-requests.service.js';
import { TripRequest } from '../entities/index.js';
import { Trip } from '../entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([TripRequest, Trip])],
  controllers: [TripRequestsController],
  providers: [TripRequestsService],
  exports: [TripRequestsService],
})
export class TripRequestsModule {}
