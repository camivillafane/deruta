import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Trip, TripStatus } from '../entities/index.js';
import { TripRequest, TripRequestStatus } from '../entities/index.js';
import { Conversation } from '../entities/index.js';
import { CreateTripRequestDto, UpdateTripRequestStatusDto } from './dto/trip-request.dto.js';

@Injectable()
export class TripRequestsService {
  constructor(
    @InjectRepository(TripRequest)
    private readonly requestRepository: Repository<TripRequest>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly dataSource: DataSource,
  ) {}

  async create(passengerId: string, dto: CreateTripRequestDto): Promise<TripRequest> {
    return this.dataSource.transaction(async (manager) => {
      const trip = await manager.findOne(Trip, {
        where: { id: dto.tripId },
        lock: { mode: 'pessimistic_write' },
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
      const acceptedSeats = await this.getAcceptedSeatsWithManager(manager, dto.tripId);

      if (acceptedSeats + seats > trip.availableSeats) {
        throw new BadRequestException('No hay suficientes lugares disponibles');
      }

      const existing = await manager.findOne(TripRequest, {
        where: { tripId: dto.tripId, passengerId },
      });
      if (existing) {
        throw new BadRequestException('Ya solicitaste lugar en este viaje');
      }

      const request = manager.create(TripRequest, {
        tripId: dto.tripId,
        passengerId,
        seats,
        message: dto.message,
        status: TripRequestStatus.PENDING,
      });

      return manager.save(request);
    });
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
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(TripRequest, {
        where: { id: requestId },
        relations: { trip: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!request) {
        throw new NotFoundException('Solicitud no encontrada');
      }
      if (request.trip.driverId !== driverId) {
        throw new ForbiddenException('No podés gestionar esta solicitud');
      }

      this.validateStatusTransition(request.status, dto.status);

      if (dto.status === TripRequestStatus.ACCEPTED) {
        const acceptedSeats = await this.getAcceptedSeatsWithManager(manager, request.tripId, request.id);
        if (acceptedSeats + request.seats > request.trip.availableSeats) {
          throw new BadRequestException('No hay suficientes lugares disponibles');
        }
        request.trip.availableSeats -= request.seats;
        await manager.save(request.trip);

        const existingConversation = await manager.findOne(Conversation, {
          where: { tripId: request.tripId },
        });
        if (!existingConversation) {
          const conversation = manager.create(Conversation, { tripId: request.tripId });
          await manager.save(conversation);
        }
      }

      if (
        request.status === TripRequestStatus.ACCEPTED &&
        (dto.status === TripRequestStatus.REJECTED || dto.status === TripRequestStatus.CANCELLED)
      ) {
        request.trip.availableSeats += request.seats;
        await manager.save(request.trip);
      }

      request.status = dto.status;
      return manager.save(request);
    });
  }

  async cancelRequest(requestId: string, passengerId: string): Promise<TripRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(TripRequest, {
        where: { id: requestId, passengerId },
        relations: { trip: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!request) {
        throw new NotFoundException('Solicitud no encontrada');
      }
      if (request.status === TripRequestStatus.CANCELLED) {
        throw new BadRequestException('La solicitud ya está cancelada');
      }
      if (request.status === TripRequestStatus.ACCEPTED) {
        request.trip.availableSeats += request.seats;
        await manager.save(request.trip);
      }
      request.status = TripRequestStatus.CANCELLED;
      return manager.save(request);
    });
  }

  private validateStatusTransition(current: TripRequestStatus, next: TripRequestStatus): void {
    const allowed: Record<TripRequestStatus, TripRequestStatus[]> = {
      [TripRequestStatus.PENDING]: [TripRequestStatus.ACCEPTED, TripRequestStatus.REJECTED],
      [TripRequestStatus.ACCEPTED]: [TripRequestStatus.REJECTED, TripRequestStatus.CANCELLED],
      [TripRequestStatus.REJECTED]: [],
      [TripRequestStatus.CANCELLED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(`No se puede cambiar el estado de ${current} a ${next}`);
    }
  }

  private async getAcceptedSeatsWithManager(
    manager: any,
    tripId: string,
    excludeRequestId?: string,
  ): Promise<number> {
    const query = manager
      .createQueryBuilder(TripRequest, 'request')
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
