import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateTripDto, ListTripsQueryDto, SearchTripsDto, UpdateTripDto } from './dto/trip.dto.js';
import { TripsService } from './trips.service.js';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTripDto, @CurrentUser('userId') userId: string) {
    return this.tripsService.create(userId, dto);
  }

  @Get()
  findAll(@Query() query: ListTripsQueryDto) {
    return this.tripsService.findAll(query);
  }

  @Get('search')
  search(@Query() dto: SearchTripsDto) {
    return this.tripsService.search(dto);
  }

  @Get('driver/my-trips')
  @UseGuards(JwtAuthGuard)
  findMyTrips(@CurrentUser('userId') userId: string) {
    return this.tripsService.findByDriver(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripsService.findOne(id);
  }

  @Get(':id/me')
  @UseGuards(JwtAuthGuard)
  findMyRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.tripsService.findMyRequest(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.tripsService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('userId') userId: string) {
    return this.tripsService.remove(id, userId);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('userId') userId: string) {
    return this.tripsService.complete(id, userId);
  }
}
