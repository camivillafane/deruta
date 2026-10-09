import { IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  tripId: string;
}

export class SendMessageDto {
  @IsUUID()
  conversationId: string;

  content: string;
}
