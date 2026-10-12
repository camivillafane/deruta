import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { EmailServiceFactory } from './email.service.js';
import { SmsServiceFactory } from './sms.service.js';

export interface NotifyData {
  userId: string;
  title: string;
  message: string;
  link?: string;
  email?: {
    subject: string;
    text: string;
    html?: string;
  };
  sms?: {
    body: string;
  };
}

@Injectable()
export class NotificationDispatcherService {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly emailServiceFactory: EmailServiceFactory,
    private readonly smsServiceFactory: SmsServiceFactory,
  ) {}

  async notify(data: NotifyData): Promise<void> {
    await this.notificationsService.create(data.userId, data.title, data.message, data.link);

    const user = await this.usersService.findById(data.userId);

    if (data.email && user.email) {
      try {
        const emailService = this.emailServiceFactory.create();
        await emailService.send({
          to: user.email,
          ...data.email,
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    if (data.sms && user.phone) {
      try {
        const smsService = this.smsServiceFactory.create();
        await smsService.send({
          to: user.phone,
          ...data.sms,
        });
      } catch (error) {
        console.error('Failed to send SMS notification:', error);
      }
    }
  }
}
