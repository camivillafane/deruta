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
  TripRequestStatus,
  TripSearch,
  User,
  UserReport,
  Vehicle,
} from '../entities/index.js';
import { TripRequestsService } from './trip-requests.service.js';

const entities = [
  User,
  Vehicle,
  Trip,
  TripRequest,
  TripSearch,
  Rating,
  Conversation,
  Message,
  Alert,
  Notification,
  UserReport,
];

describe('TripRequestsService: lugares disponibles', () => {
  let dataSource: DataSource;
  let service: TripRequestsService;
  let driver: User;
  let passengers: User[];
  let trip: Trip;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities,
      synchronize: true,
    });
    await dataSource.initialize();

    const users = dataSource.getRepository(User);
    const makeUser = (n: number) =>
      users.save(
        users.create({ name: `U${n}`, lastName: 'Test', email: `u${n}@test.com`, passwordHash: 'x' }),
      );
    driver = await makeUser(0);
    passengers = [await makeUser(1), await makeUser(2), await makeUser(3), await makeUser(4)];

    const trips = dataSource.getRepository(Trip);
    trip = await trips.save(
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

    const notifier = { notify: async () => undefined };
    service = new TripRequestsService(
      dataSource.getRepository(TripRequest),
      trips,
      dataSource.getRepository(Conversation),
      dataSource,
      notifier as never,
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  const seatsLeft = async () =>
    (await dataSource.getRepository(Trip).findOneByOrFail({ id: trip.id })).availableSeats;

  it('permite llenar todos los lugares del viaje', async () => {
    for (const passenger of passengers.slice(0, 3)) {
      const request = await service.create(passenger.id, { tripId: trip.id });
      await service.updateStatus(request.id, driver.id, { status: TripRequestStatus.ACCEPTED });
    }
    expect(await seatsLeft()).toBe(0);

    await expect(service.create(passengers[3].id, { tripId: trip.id })).rejects.toThrow(
      'No hay suficientes lugares disponibles',
    );
  });

  it('no acepta más lugares de los que quedan', async () => {
    const big = await service.create(passengers[0].id, { tripId: trip.id, seats: 2 });
    const other = await service.create(passengers[1].id, { tripId: trip.id, seats: 2 });
    await service.updateStatus(big.id, driver.id, { status: TripRequestStatus.ACCEPTED });

    await expect(
      service.updateStatus(other.id, driver.id, { status: TripRequestStatus.ACCEPTED }),
    ).rejects.toThrow('No hay suficientes lugares disponibles');
    expect(await seatsLeft()).toBe(1);
  });

  it('devuelve los lugares cuando el pasajero cancela o el conductor lo baja', async () => {
    const a = await service.create(passengers[0].id, { tripId: trip.id, seats: 2 });
    const b = await service.create(passengers[1].id, { tripId: trip.id });
    await service.updateStatus(a.id, driver.id, { status: TripRequestStatus.ACCEPTED });
    await service.updateStatus(b.id, driver.id, { status: TripRequestStatus.ACCEPTED });
    expect(await seatsLeft()).toBe(0);

    await service.cancelRequest(a.id, passengers[0].id);
    expect(await seatsLeft()).toBe(2);

    await service.updateStatus(b.id, driver.id, { status: TripRequestStatus.REJECTED });
    expect(await seatsLeft()).toBe(3);
  });
});
