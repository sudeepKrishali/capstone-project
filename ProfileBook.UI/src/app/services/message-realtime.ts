import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environment';
import { Message } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MessageRealtimeService {
  private hubConnection: HubConnection | null = null;
  private readonly messageSubject = new Subject<Message>();
  private joinedUserId: number | null = null;

  incomingMessages$(): Observable<Message> {
    return this.messageSubject.asObservable();
  }

  async connect(token: string | null): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.hubConnection && this.hubConnection.state !== HubConnectionState.Disconnected) return;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        accessTokenFactory: () => token ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      this.messageSubject.next(message);
    });

    await this.hubConnection.start();
  }

  async joinUserChannel(userId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return;
    if (this.joinedUserId === userId) return;

    if (this.joinedUserId != null) {
      await this.hubConnection.invoke('LeaveUserGroup', this.joinedUserId.toString());
    }

    await this.hubConnection.invoke('JoinUserGroup', userId.toString());
    this.joinedUserId = userId;
  }

  async disconnect(): Promise<void> {
    if (!this.hubConnection) return;
    if (this.joinedUserId != null && this.hubConnection.state === HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveUserGroup', this.joinedUserId.toString());
    }
    this.joinedUserId = null;
    await this.hubConnection.stop();
    this.hubConnection = null;
  }
}
