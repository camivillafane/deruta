import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus } from '../entities/index.js';
import { Vehicle } from '../entities/index.js';
import { CreateTripDto, SearchTripsDto, UpdateTripDto } from './dto/trip.dto.js';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(driverId: string, dto: CreateTripDto): Promise<Trip> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: dto.vehicleId, userId: driverId },
    });
    if (!vehicle) {
      throw new BadRequestException('Vehículo no válido');
    }

    const trip = this.tripRepository.create({
      ...dto,
      driverId,
      departureDate: new Date(dto.departureDate),
    });

    const saved = await this.tripRepository.save(trip);
    await this.notifyMatchingAlerts(saved);
    return saved;
  }

  async search(dto: SearchTripsDto): Promise<Trip[]> {
    const query = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .where('trip.status = :status', { status: TripStatus.ACTIVE })
      .andWhere('LOWER(trip.origin) = LOWER(:origin)', { origin: dto.origin })
      .andWhere('LOWER(trip.destination) = LOWER(:destination)', { destination: dto.destination })
      .andWhere('trip.departureDate = :date', { date: dto.departureDate })
      .orderBy('trip.departureTime', 'ASC');

    if (dto.passengers) {
      query.andWhere('trip.availableSeats >= :passengers', { passengers: dto.passengers });
    }

    return query.getMany();
  }

  async findAll(filters?: { origin?: string; destination?: string; date?: string }): Promise<Trip[]> {
    const query = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .where('trip.status = :status', { status: TripStatus.ACTIVE })
      .orderBy('trip.departureDate', 'ASC')
      .addOrderBy('trip.departureTime', 'ASC');

    if (filters?.origin) {
      query.andWhere('LOWER(trip.origin) LIKE LOWER(:origin)', { origin: `%${filters.origin}%` });
    }
    if (filters?.destination) {
      query.andWhere('LOWER(trip.destination) LIKE LOWER(:destination)', { destination: `%${filters.destination}%` });
    }
    if (filters?.date) {
      query.andWhere('trip.departureDate = :date', { date: filters.date });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: { driver: true, vehicle: true },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
    return trip;
  }

  async update(id: string, driverId: string, dto: UpdateTripDto): Promise<Trip> {
    const trip = await this.findOne(id);
    if (trip.driverId !== driverId) {
      throw new ForbiddenException('No podés editar este viaje');
    }
    Object.assign(trip, dto);
    return this.tripRepository.save(trip);
  }

  async remove(id: string, driverId: string): Promise<void> {
    const trip = await this.findOne(id);
    if (trip.driverId !== driverId) {
      throw new ForbiddenException('No podés eliminar este viaje');
    }
    trip.status = TripStatus.CANCELLED;
    await this.tripRepository.save(trip);
  }

  async findByDriver(driverId: string): Promise<Trip[]> {
    return this.tripRepository.find({
      where: { driverId },
      relations: { vehicle: true },
      order: { departureDate: 'DESC', departureTime: 'DESC' },
    });
  }

  private async notifyMatchingAlerts(_trip: Trip): Promise<void> {
    // Se implementará en el módulo de alertas/notificaciones
  }
}
