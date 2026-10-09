import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateTripSearchDto } from './dto/search.dto.js';
import { SearchesService } from './searches.service.js';

@Controller('searches')
@UseGuards(JwtAuthGuard)
export class SearchesController {
  constructor(private readonly searchesService: SearchesService) {}

  @Post()
  create(@Body() dto: CreateTripSearchDto, @CurrentUser('userId') userId: string) {
    return this.searchesService.create(userId, dto);
  }

  @Get('my-searches')
  findMySearches(@CurrentUser('userId') userId: string) {
    return this.searchesService.findByUser(userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('userId') userId: string) {
    return this.searchesService.remove(id, userId);
  }
}
