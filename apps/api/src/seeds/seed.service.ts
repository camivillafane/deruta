import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../entities/index.js';
import { Vehicle } from '../entities/index.js';
import { Trip, TripStatus } from '../entities/index.js';
import { TripRequest, TripRequestStatus } from '../entities/index.js';
import { Rating } from '../entities/index.js';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(TripRequest)
    private readonly tripRequestRepository: Repository<TripRequest>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const existing = await this.userRepository.findOne({ where: { email: 'martin@example.com' } });
    if (existing) {
      return;
    }

    const passwordHash = await hash('password123', 12);

    const users = await this.userRepository.save([
      {
        name: 'Martín',
        lastName: 'Gómez',
        email: 'martin@example.com',
        passwordHash,
        phone: '+54 9 345 1234567',
        city: 'Concordia',
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        dni: '30123456',
        licenseNumber: 'A123456789',
        rating: 4.9,
        totalTrips: 18,
      },
      {
        name: 'Lucía',
        lastName: 'Fernández',
        email: 'lucia@example.com',
        passwordHash,
        phone: '+54 9 341 7654321',
        city: 'Paraná',
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        dni: '28345678',
        licenseNumber: 'B987654321',
        rating: 4.7,
        totalTrips: 8,
      },
      {
        name: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        passwordHash,
        phone: '+54 9 11 9876543',
        city: 'Buenos Aires',
        emailVerified: false,
        phoneVerified: true,
        identityVerified: false,
        dni: '35456789',
        rating: 4.5,
        totalTrips: 5,
      },
    ]);

    const [martin, lucia, juan] = users;

    const vehicles = await this.vehicleRepository.save([
      { userId: martin.id, brand: 'Toyota', model: 'Corolla', year: 2019, color: 'Gris', plate: 'ABC123' },
      { userId: lucia.id, brand: 'Volkswagen', model: 'Gol', year: 2017, color: 'Blanco', plate: 'DEF456' },
    ]);

    const trips = await this.tripRepository.save([
      {
        driverId: martin.id,
        origin: 'Concordia',
        destination: 'Buenos Aires',
        departureDate: this.addDays(2),
        departureTime: '08:00:00',
        meetingPoint: 'Centro de Concordia, Plaza 25 de Mayo',
        availableSeats: 3,
        contributionPerPassenger: 25000,
        notes: 'Salgo temprano para evitar tráfico. Llevo aire acondicionado.',
        status: TripStatus.ACTIVE,
        vehicleId: vehicles[0].id,
      },
      {
        driverId: martin.id,
        origin: 'Concordia',
        destination: 'Paraná',
        departureDate: this.addDays(1),
        departureTime: '09:30:00',
        meetingPoint: 'Terminal de Ómnibus de Concordia',
        availableSeats: 2,
        contributionPerPassenger: 8000,
        notes: 'Viaje directo, sin paradas intermedias.',
        status: TripStatus.ACTIVE,
        vehicleId: vehicles[0].id,
      },
      {
        driverId: lucia.id,
        origin: 'Paraná',
        destination: 'Buenos Aires',
        departureDate: this.addDays(3),
        departureTime: '07:00:00',
        meetingPoint: 'Plaza 1° de Mayo, Paraná',
        availableSeats: 4,
        contributionPerPassenger: 18000,
        notes: 'Acepto mascotas pequeñas.',
        status: TripStatus.ACTIVE,
        vehicleId: vehicles[1].id,
      },
      {
        driverId: lucia.id,
        origin: 'Santa Fe',
        destination: 'Buenos Aires',
        departureDate: this.addDays(2),
        departureTime: '14:00:00',
        meetingPoint: 'Shopping La Ribera',
        availableSeats: 1,
        contributionPerPassenger: 15000,
        notes: 'Último lugar disponible.',
        status: TripStatus.ACTIVE,
        vehicleId: vehicles[1].id,
      },
    ]);

    await this.tripRequestRepository.save([
      {
        tripId: trips[0].id,
        passengerId: juan.id,
        seats: 1,
        status: TripRequestStatus.ACCEPTED,
        message: '¡Hola! Llevo solo una mochila.',
      },
      {
        tripId: trips[1].id,
        passengerId: juan.id,
        seats: 1,
        status: TripRequestStatus.PENDING,
      },
    ]);

    await this.ratingRepository.save([
      {
        tripId: trips[0].id,
        reviewerId: juan.id,
        reviewedUserId: martin.id,
        score: 5,
        comment: 'Excelente viaje, muy puntual.',
      },
      {
        tripId: trips[0].id,
        reviewerId: martin.id,
        reviewedUserId: juan.id,
        score: 5,
        comment: 'Muy buen copiloto.',
      },
    ]);
  }

  private addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
