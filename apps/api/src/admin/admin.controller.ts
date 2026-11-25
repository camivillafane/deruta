import { Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
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

  @Patch('verifications/:id/approve')
  approveIdentity(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveIdentity(id);
  }

  @Patch('verifications/:id/reject')
  rejectIdentity(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.rejectIdentity(id);
  }
}
