import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateRatingDto } from './dto/rating.dto.js';
import { RatingsService } from './ratings.service.js';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  create(@Body() dto: CreateRatingDto, @CurrentUser('userId') userId: string) {
    return this.ratingsService.create(userId, dto);
  }

  @Get('user/:id')
  findByUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.ratingsService.findByUser(id);
  }
}
