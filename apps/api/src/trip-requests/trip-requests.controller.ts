import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateTripRequestDto, UpdateTripRequestStatusDto } from './dto/trip-request.dto.js';
import { TripRequestsService } from './trip-requests.service.js';

@Controller('trip-requests')
@UseGuards(JwtAuthGuard)
export class TripRequestsController {
  constructor(private readonly tripRequestsService: TripRequestsService) {}

  @Post()
  create(@Body() dto: CreateTripRequestDto, @CurrentUser('userId') userId: string) {
    return this.tripRequestsService.create(userId, dto);
  }

  @Get('my-requests')
  findMyRequests(@CurrentUser('userId') userId: string) {
    return this.tripRequestsService.findByPassenger(userId);
  }

  @Get('received')
  findReceived(@CurrentUser('userId') userId: string) {
    return this.tripRequestsService.findByDriver(userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripRequestStatusDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.tripRequestsService.updateStatus(id, userId, dto);
  }

  @Delete(':id')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('userId') userId: string) {
    return this.tripRequestsService.cancelRequest(id, userId);
  }
}
