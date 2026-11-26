
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import databaseConfig from './config/database.config.js';

import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';
import { TripsModule } from './trips/trips.module.js';
import { TripRequestsModule } from './trip-requests/trip-requests.module.js';
import { SearchesModule } from './searches/searches.module.js';
import { RatingsModule } from './ratings/ratings.module.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { AlertsModule } from './alerts/alerts.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AdminModule } from './admin/admin.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { SeedModule } from './seeds/seed.module.js';

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
} from './entities/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      load: [databaseConfig],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
          return {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USER || 'deruta',
            password: process.env.DB_PASSWORD || 'deruta',
            database: process.env.DB_NAME || 'deruta',
            entities: [
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
            ],
            synchronize: process.env.DB_SYNCHRONIZE === 'true',
            logging: false,
          } as DataSourceOptions;
        }

        return {
          type: 'better-sqlite3',
          database: 'deruta-dev.sqlite',
          entities: [
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
          ],
          synchronize: true,
          logging: false,
        } as unknown as DataSourceOptions;
      },
    }),

    AuthModule,
    UsersModule,
    VehiclesModule,
    TripsModule,
    TripRequestsModule,
    SearchesModule,
    RatingsModule,
    ConversationsModule,
    MessagesModule,
    AlertsModule,
    NotificationsModule,
    AdminModule,
    ReportsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Límite global por IP (100 pedidos/min). Los endpoints de auth tienen límites
    // más estrictos con @Throttle en AuthController.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
