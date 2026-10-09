import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/index.js';
import { Message } from '../entities/index.js';
import { Trip } from '../entities/index.js';
import { TripRequest, TripRequestStatus } from '../entities/index.js';
import { SendMessageDto } from '../messages/dto/message.dto.js';
import { CreateConversationDto } from './dto/conversation.dto.js';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(TripRequest)
    private readonly requestRepository: Repository<TripRequest>,
  ) {}

  async create(userId: string, dto: CreateConversationDto): Promise<Conversation> {
    const existing = await this.conversationRepository.findOne({
      where: { tripId: dto.tripId },
    });
    if (existing) {
      return existing;
    }

    await this.validateAccess(userId, dto.tripId);
    const conversation = this.conversationRepository.create({ tripId: dto.tripId });
    return this.conversationRepository.save(conversation);
  }

  async findByUser(userId: string): Promise<Conversation[]> {
    const asDriver = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.trip', 'trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .where('trip.driverId = :userId', { userId })
      .getMany();

    const asPassenger = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.trip', 'trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .innerJoin('trip_requests', 'request', 'request.tripId = trip.id')
      .where('request.passengerId = :userId', { userId })
      .andWhere('request.status = :status', { status: TripRequestStatus.ACCEPTED })
      .getMany();

    const map = new Map<string, Conversation>();
    [...asDriver, ...asPassenger].forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }

  async findOne(id: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: { trip: { driver: true, vehicle: true } },
    });
    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    await this.validateAccess(userId, conversation.tripId);
    return conversation;
  }

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const conversation = await this.findOne(dto.conversationId, senderId);
    const message = this.messageRepository.create({
      conversationId: conversation.id,
      senderId,
      content: dto.content,
    });
    return this.messageRepository.save(message);
  }

  async findMessages(conversationId: string, userId: string): Promise<Message[]> {
    await this.findOne(conversationId, userId);
    return this.messageRepository.find({
      where: { conversationId },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
    });
  }

  private async validateAccess(userId: string, tripId: string): Promise<void> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
    if (trip.driverId === userId) {
      return;
    }
    const accepted = await this.requestRepository.findOne({
      where: {
        tripId,
        passengerId: userId,
        status: TripRequestStatus.ACCEPTED,
      },
    });
    if (!accepted) {
      throw new BadRequestException('No tenés acceso a esta conversación');
    }
  }
}
