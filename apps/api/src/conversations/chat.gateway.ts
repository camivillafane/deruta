import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConversationsService } from './conversations.service.js';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    client.rooms.clear();
  }

  @SubscribeMessage('join')
  async handleJoin(client: Socket, conversationId: string): Promise<void> {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect();
      return;
    }
    try {
      await this.conversationsService.findOne(conversationId, userId);
      await client.join(conversationId);
      client.emit('joined', conversationId);
    } catch {
      client.emit('error', { message: 'No podés unirte a esta conversación' });
    }
  }

  @SubscribeMessage('leave')
  async handleLeave(client: Socket, conversationId: string): Promise<void> {
    await client.leave(conversationId);
    client.emit('left', conversationId);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: { conversationId: string; content: string }): Promise<void> {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect();
      return;
    }
    try {
      const message = await this.conversationsService.sendMessage(userId, {
        conversationId: payload.conversationId,
        content: payload.content,
      });
      this.server.to(payload.conversationId).emit('newMessage', message);
    } catch (error) {
      client.emit('error', { message: (error as Error).message });
    }
  }
}
