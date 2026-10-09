import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service.js';
import { User } from '../entities/index.js';
import { Vehicle } from '../entities/index.js';
import { Trip } from '../entities/index.js';
import { TripRequest } from '../entities/index.js';
import { Rating } from '../entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Vehicle, Trip, TripRequest, Rating])],
  providers: [SeedService],
})
export class SeedModule {}
