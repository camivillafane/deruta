import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConversationsController } from './conversations.controller.js';
import { ConversationsService } from './conversations.service.js';
import { ChatGateway } from './chat.gateway.js';
import { Conversation } from '../entities/index.js';
import { Message } from '../entities/index.js';
import { Trip } from '../entities/index.js';
import { TripRequest } from '../entities/index.js';
import { CommonModule } from '../common/common.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Trip, TripRequest]), CommonModule, JwtModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, ChatGateway],
})
export class ConversationsModule {}
