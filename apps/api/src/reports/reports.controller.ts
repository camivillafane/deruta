import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ReportsService } from './reports.service.js';
import { CreateReportDto, ResolveReportDto } from './dto/report.dto.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReportDto, @CurrentUser('userId') reporterId: string) {
    return this.reportsService.create({
      reporterId,
      reportedUserId: dto.reportedUserId,
      reason: dto.reason,
      description: dto.description,
    });
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  pending() {
    return this.reportsService.findPending();
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  resolve(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveReportDto) {
    return this.reportsService.resolveReport(id, dto.adminNotes);
  }

  @Patch(':id/dismiss')
  @UseGuards(JwtAuthGuard, AdminGuard)
  dismiss(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveReportDto) {
    return this.reportsService.dismissReport(id, dto.adminNotes);
  }
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly reportsService: ReportsService) {}

  @Patch(':id/block')
  block(@Param('id', ParseUUIDPipe) id: string, @Body('reason') reason?: string) {
    return this.reportsService.blockUser(id, reason);
  }

  @Patch(':id/unblock')
  unblock(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.unblockUser(id);
  }
}
