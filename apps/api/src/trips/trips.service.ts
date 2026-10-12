import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toPublicUser } from '../common/utils/user.mapper.js';
import { Trip, TripRequest, TripStatus, User, TripSearch } from '../entities/index.js';
import { Vehicle } from '../entities/index.js';
import { CreateTripDto, ListTripsQueryDto, SearchTripsDto, UpdateTripDto } from './dto/trip.dto.js';
import { NotificationDispatcherService } from '../common/services/notification-dispatcher.service.js';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(TripRequest)
    private readonly requestRepository: Repository<TripRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TripSearch)
    private readonly searchRepository: Repository<TripSearch>,
    private readonly notificationDispatcher: NotificationDispatcherService,
  ) {}

  async create(driverId: string, dto: CreateTripDto): Promise<Trip> {
    const driver = await this.userRepository.findOne({ where: { id: driverId } });
    if (!driver?.emailVerified || !driver?.phoneVerified || !driver?.identityVerified) {
      throw new BadRequestException('Tenés que verificar tu email, teléfono e identidad para publicar un viaje');
    }

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

  async search(dto: SearchTripsDto): Promise<{ data: Trip[]; total: number; page: number; limit: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
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

    const [trips, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return {
      data: trips.map((trip) => ({ ...trip, driver: toPublicUser(trip.driver) as Trip['driver'] })),
      total,
      page,
      limit,
    };
  }

  async findAll(filters?: ListTripsQueryDto): Promise<{ data: Trip[]; total: number; page: number; limit: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;

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

    const [trips, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return {
      data: trips.map((trip) => ({ ...trip, driver: toPublicUser(trip.driver) as Trip['driver'] })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: { driver: true, vehicle: true },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
    return { ...trip, driver: toPublicUser(trip.driver) as Trip['driver'] };
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
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: { requests: { passenger: true } },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
    if (trip.driverId !== driverId) {
      throw new ForbiddenException('No podés eliminar este viaje');
    }
    trip.status = TripStatus.CANCELLED;
    await this.tripRepository.save(trip);

    const acceptedRequests = trip.requests?.filter((request) => request.status === 'accepted') ?? [];
    for (const request of acceptedRequests) {
      await this.notificationDispatcher.notify({
        userId: request.passengerId,
        title: 'Viaje cancelado',
        message: `El viaje ${trip.origin} → ${trip.destination} fue cancelado por el conductor`,
        link: '/mis-viajes',
        email: {
          subject: 'Viaje cancelado - DE RUTA',
          text: `El viaje ${trip.origin} → ${trip.destination} fue cancelado por el conductor. Buscá otra opción en la app.`,
        },
      });
    }
  }

  async findByDriver(driverId: string): Promise<Trip[]> {
    const trips = await this.tripRepository.find({
      where: { driverId },
      relations: { vehicle: true, requests: { passenger: true } },
      order: { departureDate: 'DESC', departureTime: 'DESC' },
    });
    return trips.map((trip) => ({
      ...trip,
      requests: trip.requests?.map((request) => ({
        ...request,
        passenger: toPublicUser(request.passenger) as Trip['requests'][number]['passenger'],
      })),
    }));
  }

  async findMyRequest(tripId: string, userId: string): Promise<{ request: TripRequest | null }> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
    const request = await this.requestRepository.findOne({
      where: { tripId, passengerId: userId },
      relations: { passenger: true },
    });
    return { request };
  }

  async complete(id: string, driverId: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: { requests: { passenger: true } },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
    if (trip.driverId !== driverId) {
      throw new ForbiddenException('No podés completar este viaje');
    }
    if (trip.status !== TripStatus.ACTIVE) {
      throw new BadRequestException('Solo se pueden completar viajes activos');
    }
    trip.status = TripStatus.COMPLETED;
    const saved = await this.tripRepository.save(trip);

    const acceptedRequests = trip.requests?.filter((request) => request.status === 'accepted') ?? [];
    for (const request of acceptedRequests) {
      await this.notificationDispatcher.notify({
        userId: request.passengerId,
        title: 'Viaje completado',
        message: `El viaje ${trip.origin} → ${trip.destination} fue completado. Dejá tu calificación.`,
        link: '/mis-viajes',
        email: {
          subject: 'Viaje completado - DE RUTA',
          text: `El viaje ${trip.origin} → ${trip.destination} fue completado. Ingresá para calificar a tu compañero de viaje.`,
        },
      });
    }

    return saved;
  }

  private async notifyMatchingAlerts(trip: Trip): Promise<void> {
    const searches = await this.searchRepository.find({
      where: {
        origin: trip.origin,
        destination: trip.destination,
        date: trip.departureDate,
      },
    });

    for (const search of searches) {
      await this.notificationDispatcher.notify({
        userId: search.userId,
        title: 'Apareció un viaje para tu búsqueda',
        message: `Hay un viaje de ${trip.origin} → ${trip.destination} el ${trip.departureDate.toISOString().split('T')[0]}`,
        link: `/viajes/${trip.id}`,
        email: {
          subject: 'Apareció un viaje - DE RUTA',
          text: `Hay un viaje de ${trip.origin} → ${trip.destination} el ${trip.departureDate.toISOString().split('T')[0]}. Ingresá para ver los detalles.`,
        },
      });
    }
  }
}
