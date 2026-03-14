import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Post } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private baseUrl = `${environment.apiUrl}/Post`;

  constructor(private http: HttpClient) {}

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.baseUrl);
  }

  createPost(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, formData);
  }

  likePost(postId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${postId}/like`, {});
  }

  addComment(postId: number, text: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${postId}/comment`, { text });
  }
}