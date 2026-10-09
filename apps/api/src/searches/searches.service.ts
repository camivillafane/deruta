import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripSearch } from '../entities/index.js';
import { CreateTripSearchDto } from './dto/search.dto.js';

@Injectable()
export class SearchesService {
  constructor(
    @InjectRepository(TripSearch)
    private readonly searchRepository: Repository<TripSearch>,
  ) {}

  async create(userId: string, dto: CreateTripSearchDto): Promise<TripSearch> {
    const search = this.searchRepository.create({
      ...dto,
      userId,
      date: new Date(dto.date),
    });
    return this.searchRepository.save(search);
  }

  async findByUser(userId: string): Promise<TripSearch[]> {
    return this.searchRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.searchRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Búsqueda no encontrada');
    }
  }
}
