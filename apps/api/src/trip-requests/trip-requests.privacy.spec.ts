import 'reflect-metadata';
import { DataSource } from 'typeorm';

import {
  Alert,
  Conversation,
  Message,
  Notification,
  Rating,
  Trip,
  TripRequest,
  TripSearch,
  User,
  UserReport,
  Vehicle,
} from '../entities/index.js';
import { TripRequestsService } from './trip-requests.service.js';

const entities = [User, Vehicle, Trip, TripRequest, TripSearch, Rating, Conversation, Message, Alert, Notification, UserReport];
const PRIVATE_FIELDS = ['email', 'phone', 'dni', 'licenseNumber', 'licenseFrontImage', 'licenseBackImage', 'role'];

describe('TripRequestsService: datos personales', () => {
  let dataSource: DataSource;
  let service: TripRequestsService;
  let driver: User;
  let passenger: User;

  beforeEach(async () => {
    dataSource = new DataSource({ type: 'better-sqlite3', database: ':memory:', entities, synchronize: true });
    await dataSource.initialize();
    const users = dataSource.getRepository(User);
    const sensitive = {
      phone: '+5493510000000',
      dni: '30111222',
      licenseNumber: 'A123456',
      licenseFrontImage: 'https://x/front.jpg',
      licenseBackImage: 'https://x/back.jpg',
      passwordHash: 'x',
    };
    driver = await users.save(users.create({ name: 'Conductor', lastName: 'A', email: 'driver@test.com', ...sensitive }));
    passenger = await users.save(users.create({ name: 'Pasajero', lastName: 'B', email: 'pax@test.com', ...sensitive }));

    const trips = dataSource.getRepository(Trip);
    const trip = await trips.save(
      trips.create({
        driverId: driver.id,
        origin: 'Córdoba',
        destination: 'Rosario',
        departureDate: new Date('2030-01-10'),
        departureTime: '08:00',
        availableSeats: 3,
        contributionPerPassenger: 1000,
      }),
    );
    service = new TripRequestsService(
      dataSource.getRepository(TripRequest),
      trips,
      dataSource.getRepository(Conversation),
      dataSource,
      { notify: async () => undefined } as never,
    );
    await service.create(passenger.id, { tripId: trip.id });
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('el pasajero ve solo datos públicos del conductor', async () => {
    const [request] = await service.findByPassenger(passenger.id);
    expect(request.trip.driver.name).toBe('Conductor');
    for (const field of PRIVATE_FIELDS) {
      expect(request.trip.driver).not.toHaveProperty(field);
    }
  });

  it('el conductor ve solo datos públicos del pasajero', async () => {
    const [request] = await service.findByDriver(driver.id);
    expect(request.passenger.name).toBe('Pasajero');
    for (const field of PRIVATE_FIELDS) {
      expect(request.passenger).not.toHaveProperty(field);
    }
  });
});
