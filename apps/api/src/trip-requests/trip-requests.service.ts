import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus } from '../entities/index.js';
import { TripRequest, TripRequestStatus } from '../entities/index.js';
import { CreateTripRequestDto, UpdateTripRequestStatusDto } from './dto/trip-request.dto.js';

@Injectable()
export class TripRequestsService {
  constructor(
    @InjectRepository(TripRequest)
    private readonly requestRepository: Repository<TripRequest>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) {}

  async create(passengerId: string, dto: CreateTripRequestDto): Promise<TripRequest> {
    const trip = await this.tripRepository.findOne({
      where: { id: dto.tripId },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
    if (trip.driverId === passengerId) {
      throw new BadRequestException('No podés solicitar lugar en tu propio viaje');
    }
    if (trip.status !== TripStatus.ACTIVE) {
      throw new BadRequestException('Este viaje no está activo');
    }

    const seats = dto.seats || 1;
    const acceptedSeats = await this.getAcceptedSeats(dto.tripId);

    if (acceptedSeats + seats > trip.availableSeats) {
      throw new BadRequestException('No hay suficientes lugares disponibles');
    }

    const existing = await this.requestRepository.findOne({
      where: { tripId: dto.tripId, passengerId },
    });
    if (existing) {
      throw new BadRequestException('Ya solicitaste lugar en este viaje');
    }

    const request = this.requestRepository.create({
      tripId: dto.tripId,
      passengerId,
      seats,
      message: dto.message,
      status: TripRequestStatus.PENDING,
    });

    return this.requestRepository.save(request);
  }

  async findByPassenger(passengerId: string): Promise<TripRequest[]> {
    return this.requestRepository.find({
      where: { passengerId },
      relations: { trip: { driver: true, vehicle: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findByDriver(driverId: string): Promise<TripRequest[]> {
    return this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.trip', 'trip')
      .leftJoinAndSelect('request.passenger', 'passenger')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .where('trip.driverId = :driverId', { driverId })
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }

  async updateStatus(
    requestId: string,
    driverId: string,
    dto: UpdateTripRequestStatusDto,
  ): Promise<TripRequest> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: { trip: true },
    });
    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (request.trip.driverId !== driverId) {
      throw new ForbiddenException('No podés gestionar esta solicitud');
    }

    if (dto.status === TripRequestStatus.ACCEPTED) {
      const acceptedSeats = await this.getAcceptedSeats(request.tripId, request.id);
      if (acceptedSeats + request.seats > request.trip.availableSeats) {
        throw new BadRequestException('No hay suficientes lugares disponibles');
      }
    }

    request.status = dto.status;
    return this.requestRepository.save(request);
  }

  async cancelRequest(requestId: string, passengerId: string): Promise<TripRequest> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, passengerId },
      relations: { trip: true },
    });
    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (request.status === TripRequestStatus.CANCELLED) {
      throw new BadRequestException('La solicitud ya está cancelada');
    }
    request.status = TripRequestStatus.CANCELLED;
    return this.requestRepository.save(request);
  }

  private async getAcceptedSeats(tripId: string, excludeRequestId?: string): Promise<number> {
    const query = this.requestRepository
      .createQueryBuilder('request')
      .select('SUM(request.seats)', 'total')
      .where('request.tripId = :tripId', { tripId })
      .andWhere('request.status = :status', { status: TripRequestStatus.ACCEPTED });

    if (excludeRequestId) {
      query.andWhere('request.id != :excludeRequestId', { excludeRequestId });
    }

    const result = await query.getRawOne();
    return parseInt(result?.total || '0', 10);
  }
}
