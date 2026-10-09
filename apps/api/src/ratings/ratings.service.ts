import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '../entities/index.js';
import { Trip } from '../entities/index.js';
import { TripRequest, TripRequestStatus } from '../entities/index.js';
import { UsersService } from '../users/users.service.js';
import { CreateRatingDto } from './dto/rating.dto.js';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(TripRequest)
    private readonly requestRepository: Repository<TripRequest>,
    private readonly usersService: UsersService,
  ) {}

  async create(reviewerId: string, dto: CreateRatingDto): Promise<Rating> {
    const trip = await this.tripRepository.findOne({
      where: { id: dto.tripId },
      relations: { driver: true },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }

    const isDriver = trip.driverId === reviewerId;
    const acceptedRequest = await this.requestRepository.findOne({
      where: {
        tripId: dto.tripId,
        passengerId: reviewerId,
        status: TripRequestStatus.ACCEPTED,
      },
    });
    const isPassenger = !!acceptedRequest;

    if (!isDriver && !isPassenger) {
      throw new BadRequestException('No podés calificar este viaje');
    }

    const reviewedUserId = dto.reviewedUserId;
    if (reviewerId === reviewedUserId) {
      throw new BadRequestException('No podés calificarte a vos mismo');
    }

    const existing = await this.ratingRepository.findOne({
      where: { tripId: dto.tripId, reviewerId, reviewedUserId },
    });
    if (existing) {
      throw new BadRequestException('Ya calificaste a este usuario en este viaje');
    }

    const rating = this.ratingRepository.create({
      ...dto,
      reviewerId,
    });

    const saved = await this.ratingRepository.save(rating);
    await this.usersService.updateRating(reviewedUserId);
    return saved;
  }

  async findByUser(userId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { reviewedUserId: userId },
      relations: { reviewer: true },
      order: { createdAt: 'DESC' },
    });
  }
}
