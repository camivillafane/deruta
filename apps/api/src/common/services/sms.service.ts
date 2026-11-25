import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendSmsData {
  to: string;
  body: string;
}

export interface SmsService {
  send(data: SendSmsData): Promise<void>;
}

@Injectable()
export class ConsoleSmsService implements SmsService {
  async send(data: SendSmsData): Promise<void> {
    console.log('[SMS]', data);
  }
}

@Injectable()
export class TwilioSmsService implements SmsService {
  constructor(private readonly configService: ConfigService) {}

  async send(data: SendSmsData): Promise<void> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !from) {
      throw new Error('Configuración de Twilio incompleta');
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: data.to,
          From: from,
          Body: data.body,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Twilio error: ${response.status} ${await response.text()}`);
    }
  }
}

@Injectable()
export class SmsServiceFactory {
  constructor(private readonly configService: ConfigService) {}

  create(): SmsService {
    const provider = this.configService.get<string>('SMS_PROVIDER', 'console');
    switch (provider) {
      case 'twilio':
        return new TwilioSmsService(this.configService);
      case 'console':
      default:
        return new ConsoleSmsService();
    }
  }
}
