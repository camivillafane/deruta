import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('verifications/pending')
  pendingIdentityVerifications() {
    return this.adminService.findPendingIdentityVerifications();
  }

  @Get('verifications/:id/documents/:side')
  @Header('Cache-Control', 'private, no-store')
  async identityDocument(@Param('id', ParseUUIDPipe) id: string, @Param('side') side: string) {
    if (side !== 'front' && side !== 'back') {
      throw new BadRequestException('Lado inválido');
    }
    const { buffer, contentType } = await this.adminService.getIdentityDocument(id, side);
    return new StreamableFile(buffer, { type: contentType });
  }

  @Patch('verifications/:id/approve')
  approveIdentity(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveIdentity(id);
  }

  @Patch('verifications/:id/reject')
  rejectIdentity(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.rejectIdentity(id);
  }
}
