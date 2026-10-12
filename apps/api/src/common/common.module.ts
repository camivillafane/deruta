import { Module } from '@nestjs/common';
import { EmailServiceFactory } from './services/email.service.js';
import { SmsServiceFactory } from './services/sms.service.js';
import { StorageServiceFactory } from './services/storage.service.js';

@Module({
  providers: [EmailServiceFactory, SmsServiceFactory, StorageServiceFactory],
  exports: [EmailServiceFactory, SmsServiceFactory, StorageServiceFactory],
})
export class CommonModule {}
