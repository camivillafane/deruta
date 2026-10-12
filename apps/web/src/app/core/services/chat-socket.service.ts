import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChatSocketService {
  private socket: Socket | null = null;

  constructor(private authService: AuthService) {}

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = this.authService.getToken();
    this.socket = io(`${environment.apiUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  join(conversationId: string): void {
    this.socket?.emit('join', conversationId);
  }

  leave(conversationId: string): void {
    this.socket?.emit('leave', conversationId);
  }

  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit('sendMessage', { conversationId, content });
  }

  onNewMessage(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket?.on('newMessage', (message) => subscriber.next(message));
    });
  }

  onError(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket?.on('error', (error) => subscriber.next(error));
    });
  }
}
