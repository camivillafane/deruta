import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ConversationsService } from './conversations.service.js';
import { CreateConversationDto } from './dto/conversation.dto.js';
import { SendMessageDto } from '../messages/dto/message.dto.js';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@Body() dto: CreateConversationDto, @CurrentUser('userId') userId: string) {
    return this.conversationsService.create(userId, dto);
  }

  @Get()
  findByUser(@CurrentUser('userId') userId: string) {
    return this.conversationsService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('userId') userId: string) {
    return this.conversationsService.findOne(id, userId);
  }

  @Get(':id/messages')
  findMessages(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('userId') userId: string) {
    return this.conversationsService.findMessages(id, userId);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.conversationsService.sendMessage(userId, { ...dto, conversationId: id });
  }
}
