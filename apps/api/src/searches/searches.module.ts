import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchesController } from './searches.controller.js';
import { SearchesService } from './searches.service.js';
import { TripSearch } from '../entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([TripSearch])],
  controllers: [SearchesController],
  providers: [SearchesService],
  exports: [SearchesService],
})
export class SearchesModule {}
