import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Message } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private baseUrl = `${environment.apiUrl}/Message`;

  constructor(private http: HttpClient) {}

  getChat(user1Id: number, user2Id: number): Observable<Message[]> {
    console.log("sender user: "+user1Id);
    console.log("receiver user: "+user2Id);
    
    return this.http.get<Message[]>(`${this.baseUrl}/chat/${user1Id}/${user2Id}`);
  }

  sendMessage(senderId: number, receiverId: number, messageContent: string): Observable<Message> {
    return this.http.post<Message>(this.baseUrl, {
      senderId,
      receiverId,
      messageContent,
    });
  }
}
