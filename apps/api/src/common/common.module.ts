import { Module } from '@nestjs/common';
import { EmailServiceFactory } from './services/email.service.js';
import { SmsServiceFactory } from './services/sms.service.js';
import { StorageServiceFactory } from './services/storage.service.js';
import { NotificationDispatcherService } from './services/notification-dispatcher.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [NotificationsModule, UsersModule],
  providers: [EmailServiceFactory, SmsServiceFactory, StorageServiceFactory, NotificationDispatcherService],
  exports: [EmailServiceFactory, SmsServiceFactory, StorageServiceFactory, NotificationDispatcherService],
})
export class CommonModule {}
