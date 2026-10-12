import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsController } from './conversations.controller.js';
import { ConversationsService } from './conversations.service.js';
import { Conversation } from '../entities/index.js';
import { Message } from '../entities/index.js';
import { Trip } from '../entities/index.js';
import { TripRequest } from '../entities/index.js';
import { CommonModule } from '../common/common.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Trip, TripRequest]), CommonModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
