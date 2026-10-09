import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toPublicUser } from '../common/utils/user.mapper.js';
import { Rating } from '../entities/index.js';
import { Trip, TripStatus } from '../entities/index.js';
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
      relations: { driver: true, requests: { passenger: true } },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (trip.status !== TripStatus.COMPLETED) {
      throw new BadRequestException('Solo podés calificar viajes completados');
    }

    const isDriver = trip.driverId === reviewerId;
    const acceptedRequest = trip.requests?.find(
      (request) => request.passengerId === reviewerId && request.status === TripRequestStatus.ACCEPTED,
    );
    const isPassenger = !!acceptedRequest;

    if (!isDriver && !isPassenger) {
      throw new BadRequestException('No podés calificar este viaje');
    }

    const reviewedUserId = dto.reviewedUserId;
    if (reviewerId === reviewedUserId) {
      throw new BadRequestException('No podés calificarte a vos mismo');
    }

    const validReviewedUserId = isDriver
      ? acceptedRequest?.passengerId
      : trip.driverId;
    if (reviewedUserId !== validReviewedUserId) {
      throw new BadRequestException('Solo podés calificar a la contraparte de este viaje');
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
    const ratings = await this.ratingRepository.find({
      where: { reviewedUserId: userId },
      relations: { reviewer: true },
      order: { createdAt: 'DESC' },
    });
    return ratings.map((rating) => ({
      ...rating,
      reviewer: toPublicUser(rating.reviewer) as Rating['reviewer'],
    }));
  }
}
