import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { AuthService } from '../../auth/auth.service.js';
import {
  IDENTITY_DOCUMENT_KEY,
  IdentityDocumentsService,
  detectImageExtension,
} from './identity-documents.service.js';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]);

describe('Documentos de identidad', () => {
  let dir: string;
  let docs: IdentityDocumentsService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'deruta-id-'));
    docs = new IdentityDocumentsService({ get: () => dir } as never);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('detecta el formato por el contenido', () => {
    expect(detectImageExtension(JPEG)).toBe('jpg');
    expect(detectImageExtension(PNG)).toBe('png');
    expect(detectImageExtension(WEBP)).toBe('webp');
    expect(detectImageExtension(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
  });

  it('guarda, lee y borra una foto', async () => {
    const key = await docs.save(JPEG);
    expect(key).toMatch(IDENTITY_DOCUMENT_KEY);
    expect(await docs.exists(key)).toBe(true);

    const file = await docs.read(key);
    expect(file.contentType).toBe('image/jpeg');
    expect(file.buffer.equals(JPEG)).toBe(true);

    await docs.remove(key);
    expect(await docs.exists(key)).toBe(false);
  });

  it('rechaza archivos que no son imágenes y claves con rutas', async () => {
    await expect(docs.save(Buffer.from('hola'))).rejects.toThrow('JPG, PNG o WEBP');
    await expect(docs.read('../../etc/passwd')).rejects.toThrow('Documento no encontrado');
    expect(await docs.exists('../secreto.jpg')).toBe(false);
  });

  describe('envío de identidad', () => {
    function makeService(autoApprove?: string) {
      const calls: string[] = [];
      const usersService = {
        submitIdentity: async () => void calls.push('submit'),
        approveIdentity: async () => void calls.push('approve'),
      };
      const config = {
        get: (key: string, fallback?: unknown) => (key === 'IDENTITY_AUTO_APPROVE' ? autoApprove : fallback),
      };
      const service = new AuthService(usersService as never, {} as never, config as never, {} as never, {} as never, docs);
      return { service, calls };
    }

    it('queda pendiente de revisión (no se aprueba sola)', async () => {
      const { service, calls } = makeService();
      const front = await docs.save(JPEG);
      const back = await docs.save(PNG);
      await service.submitIdentity('u1', { dni: '30111222', licenseNumber: 'A12345', licenseFrontImage: front, licenseBackImage: back });
      expect(calls).toEqual(['submit']);
    });

    it('se aprueba sola solo con IDENTITY_AUTO_APPROVE=true', async () => {
      const { service, calls } = makeService('true');
      const front = await docs.save(JPEG);
      const back = await docs.save(JPEG);
      await service.submitIdentity('u1', { dni: '30111222', licenseNumber: 'A12345', licenseFrontImage: front, licenseBackImage: back });
      expect(calls).toEqual(['submit', 'approve']);
    });

    it('rechaza claves de fotos que no se subieron', async () => {
      const { service } = makeService();
      const front = await docs.save(JPEG);
      await expect(
        service.submitIdentity('u1', {
          dni: '30111222',
          licenseNumber: 'A12345',
          licenseFrontImage: front,
          licenseBackImage: '00000000-0000-0000-0000-000000000000.jpg',
        }),
      ).rejects.toThrow('No encontramos una de las fotos');
    });
  });
});
