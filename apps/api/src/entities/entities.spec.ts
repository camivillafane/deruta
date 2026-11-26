import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';

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
} from './index.js';

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

/**
 * Arma la metadata de TypeORM sin abrir conexión. Es el mismo paso que corre
 * DataSource.initialize() (EntityMetadataValidator), donde producción falló con
 * DataTypeNotSupportedError por columnas 'datetime' en Postgres.
 */
async function buildMetadata(options: DataSourceOptions): Promise<DataSource> {
  const dataSource = new DataSource({ ...options, entities });
  await (dataSource as unknown as { buildMetadatas(): Promise<void> }).buildMetadatas();
  return dataSource;
}

describe('Entidades de TypeORM', () => {
  it('son válidas para Postgres (producción)', async () => {
    const dataSource = await buildMetadata({ type: 'postgres' });
    expect(dataSource.entityMetadatas).toHaveLength(entities.length);
  });

  it('son válidas para SQLite (desarrollo)', async () => {
    const dataSource = await buildMetadata({ type: 'better-sqlite3', database: ':memory:' });
    expect(dataSource.entityMetadatas).toHaveLength(entities.length);
  });

  it('en Postgres todas las fechas con hora usan el mismo tipo que createdAt', async () => {
    const dataSource = await buildMetadata({ type: 'postgres' });
    const userMetadata = dataSource.getMetadata(User);
    const typeOf = (property: string) =>
      dataSource.driver.normalizeType(userMetadata.findColumnWithPropertyName(property)!);

    expect(typeOf('createdAt')).toBe('timestamp without time zone');
    for (const property of [
      'emailVerificationExpiresAt',
      'phoneVerificationExpiresAt',
      'identitySubmittedAt',
      'identityVerifiedAt',
      'blockedAt',
    ]) {
      expect(typeOf(property), property).toBe('timestamp without time zone');
    }
  });
});
