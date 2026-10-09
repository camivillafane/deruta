import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsController } from './ratings.controller.js';
import { RatingsService } from './ratings.service.js';
import { Rating } from '../entities/index.js';
import { Trip } from '../entities/index.js';
import { TripRequest } from '../entities/index.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Trip, TripRequest]), UsersModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
