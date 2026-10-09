import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsController } from './trips.controller.js';
import { TripsService } from './trips.service.js';
import { Trip } from '../entities/index.js';
import { Vehicle } from '../entities/index.js';
import { TripRequest } from '../entities/index.js';
import { User } from '../entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Vehicle, TripRequest, User])],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
