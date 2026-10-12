import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface UploadFileData {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

export interface StorageService {
  upload(data: UploadFileData): Promise<string>;
}

@Injectable()
export class LocalStorageService implements StorageService {
  constructor(private readonly configService: ConfigService) {}

  async upload(data: UploadFileData): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = data.filename.split('.').pop() || 'bin';
    const hash = createHash('sha256').update(data.buffer).update(Date.now().toString()).digest('hex');
    const filename = `${hash}.${ext}`;
    const path = join(uploadDir, filename);

    await fs.writeFile(path, data.buffer);

    const baseUrl = this.configService.get<string>('LOCAL_STORAGE_URL', 'http://localhost:3000/uploads');
    return `${baseUrl}/${filename}`;
  }
}

@Injectable()
export class CloudinaryStorageService implements StorageService {
  constructor(private readonly configService: ConfigService) {}

  async upload(data: UploadFileData): Promise<string> {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Configuración de Cloudinary incompleta');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = createHash('sha1')
      .update(`timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(data.buffer)], { type: data.mimetype }), data.filename);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary error: ${response.status} ${await response.text()}`);
    }

    const result = await response.json() as { secure_url: string };
    return result.secure_url;
  }
}

@Injectable()
export class S3StorageService implements StorageService {
  constructor(private readonly configService: ConfigService) {}

  async upload(data: UploadFileData): Promise<string> {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('Configuración de AWS S3 incompleta');
    }

    const ext = data.filename.split('.').pop() || 'bin';
    const hash = createHash('sha256').update(data.buffer).update(Date.now().toString()).digest('hex');
    const key = `uploads/${hash}.${ext}`;
    const date = new Date().toISOString().replace(/[:\-]*/g, '').split('.')[0] + 'Z';
    const credential = `${accessKeyId}/${date.slice(0, 8)}/${region}/s3/aws4_request`;

    // AWS Signature Version 4 implementation would go here.
    // For simplicity, this is a placeholder that throws until a proper S3 SDK is integrated.
    throw new Error('AWS S3 upload requires aws-sdk integration. Use Cloudinary or local storage for now.');
  }
}

@Injectable()
export class StorageServiceFactory {
  constructor(private readonly configService: ConfigService) {}

  create(): StorageService {
    const provider = this.configService.get<string>('STORAGE_PROVIDER', 'local');
    switch (provider) {
      case 'cloudinary':
        return new CloudinaryStorageService(this.configService);
      case 's3':
        return new S3StorageService(this.configService);
      case 'local':
      default:
        return new LocalStorageService(this.configService);
    }
  }
}
