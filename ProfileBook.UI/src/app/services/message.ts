import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { ConversationSummary, Message } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private baseUrl = `${environment.apiUrl}/Message`;

  constructor(private http: HttpClient) {}

  getConversations(userId: number): Observable<ConversationSummary[]> {
    return this.http.get<ConversationSummary[]>(`${this.baseUrl}/conversations/${userId}`);
  }

  getChat(user1Id: number, user2Id: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/chat/${user1Id}/${user2Id}`);
  }

  markConversationRead(userId: number, otherUserId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/mark-read/${userId}/${otherUserId}`, {});
  }

  sendMessage(senderId: number, receiverId: number, messageContent: string): Observable<Message> {
    return this.http.post<Message>(this.baseUrl, {
      senderId,
      receiverId,
      messageContent,
    });
  }
}
