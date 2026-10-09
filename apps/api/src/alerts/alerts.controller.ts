import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateAlertDto } from './dto/alert.dto.js';
import { AlertsService } from './alerts.service.js';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@Body() dto: CreateAlertDto, @CurrentUser('userId') userId: string) {
    return this.alertsService.create(userId, dto);
  }

  @Get('my-alerts')
  findMyAlerts(@CurrentUser('userId') userId: string) {
    return this.alertsService.findByUser(userId);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('userId') userId: string) {
    return this.alertsService.deactivate(id, userId);
  }
}
