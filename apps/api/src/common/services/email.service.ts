import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailService {
  send(data: SendEmailData): Promise<void>;
}

@Injectable()
export class ConsoleEmailService implements EmailService {
  constructor(private readonly configService: ConfigService) {}

  async send(data: SendEmailData): Promise<void> {
    console.log('[EMAIL]', {
      from: this.configService.get('EMAIL_FROM'),
      ...data,
    });
  }
}

@Injectable()
export class SendgridEmailService implements EmailService {
  constructor(private readonly configService: ConfigService) {}

  async send(data: SendEmailData): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY no configurada');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: data.to }] }],
        from: { email: this.configService.get('EMAIL_FROM') },
        subject: data.subject,
        content: [
          { type: 'text/plain', value: data.text },
          ...(data.html ? [{ type: 'text/html', value: data.html }] : []),
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.status} ${await response.text()}`);
    }
  }
}

@Injectable()
export class ResendEmailService implements EmailService {
  constructor(private readonly configService: ConfigService) {}

  async send(data: SendEmailData): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY no configurada');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.configService.get('EMAIL_FROM'),
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend error: ${response.status} ${await response.text()}`);
    }
  }
}

@Injectable()
export class EmailServiceFactory {
  constructor(private readonly configService: ConfigService) {}

  create(): EmailService {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'console');
    switch (provider) {
      case 'sendgrid':
        return new SendgridEmailService(this.configService);
      case 'resend':
        return new ResendEmailService(this.configService);
      case 'console':
      default:
        return new ConsoleEmailService(this.configService);
    }
  }
}
