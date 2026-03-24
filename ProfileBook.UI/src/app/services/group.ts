import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Group, GroupMessage, User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private baseUrl = `${environment.apiUrl}/Group`;

  constructor(private http: HttpClient) {}

  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.baseUrl);
  }

  createGroup(groupName: string): Observable<Group> {
    const payload: Partial<Group> = { groupName };
    return this.http.post<Group>(this.baseUrl, payload);
  }

  addUserToGroup(groupId: number, userId: number): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${groupId}/add-member/${userId}`, {});
  }

  removeUserFromGroup(groupId: number, userId: number): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${groupId}/remove-member/${userId}`, {});
  }

  getMyGroup(): Observable<Group | null> {
    return this.http.get<Group | null>(`${this.baseUrl}/my-group`);
  }

  getMyGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}/my-groups`);
  }

  getMyGroupMessages(groupId: number): Observable<GroupMessage[]> {
    return this.http.get<GroupMessage[]>(
      `${this.baseUrl}/my-groups/${groupId}/messages`
    );
  }

  sendMyGroupMessage(groupId: number, content: string): Observable<GroupMessage> {
    return this.http.post<GroupMessage>(`${this.baseUrl}/my-groups/${groupId}/messages`, {
      messageContent: content,
    });
  }

  deleteGroup(groupId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${groupId}`);
  }
}

