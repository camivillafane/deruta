import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

/** Tamaño máximo por foto. El proxy acepta hasta 4 MB por pedido. */
export const MAX_IDENTITY_DOCUMENT_BYTES = 4 * 1024 * 1024;

/** Formato de las claves que devuelve save(): `<uuid>.<ext>`. */
export const IDENTITY_DOCUMENT_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

const CONTENT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const;
type Extension = keyof typeof CONTENT_TYPES;

/** Detecta el formato por los primeros bytes, no por el nombre ni el mimetype que manda el cliente. */
export function detectImageExtension(buffer: Buffer): Extension | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  return null;
}

/**
 * Fotos de documentos (licencia de conducir). Se guardan en una carpeta PRIVADA,
 * fuera de `uploads/` (que se sirve públicamente), y solo se leen desde el panel
 * de admin a través de la API.
 */
@Injectable()
export class IdentityDocumentsService {
  private readonly dir: string;

  constructor(configService: ConfigService) {
    this.dir = resolve(configService.get<string>('IDENTITY_DOCS_DIR') ?? join(process.cwd(), 'private', 'identity'));
  }

  async save(buffer: Buffer): Promise<string> {
    if (!buffer?.length) {
      throw new BadRequestException('Falta la foto');
    }
    if (buffer.length > MAX_IDENTITY_DOCUMENT_BYTES) {
      throw new BadRequestException('La foto pesa más de 4 MB');
    }
    const ext = detectImageExtension(buffer);
    if (!ext) {
      throw new BadRequestException('La foto tiene que ser JPG, PNG o WEBP');
    }
    await fs.mkdir(this.dir, { recursive: true });
    const key = `${randomUUID()}.${ext}`;
    await fs.writeFile(join(this.dir, key), buffer, { mode: 0o600 });
    return key;
  }

  async exists(key: string): Promise<boolean> {
    if (!IDENTITY_DOCUMENT_KEY.test(key)) return false;
    return fs.access(join(this.dir, key)).then(
      () => true,
      () => false,
    );
  }

  async read(key: string | null | undefined): Promise<{ buffer: Buffer; contentType: string }> {
    if (!key || !IDENTITY_DOCUMENT_KEY.test(key)) {
      throw new NotFoundException('Documento no encontrado');
    }
    const ext = key.split('.').pop() as Extension;
    try {
      return { buffer: await fs.readFile(join(this.dir, key)), contentType: CONTENT_TYPES[ext] };
    } catch {
      throw new NotFoundException('Documento no encontrado');
    }
  }

  async remove(key: string | null | undefined): Promise<void> {
    if (!key || !IDENTITY_DOCUMENT_KEY.test(key)) return;
    await fs.rm(join(this.dir, key), { force: true });
  }
}
