import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/Auth`;

  constructor(private http: HttpClient) {}

  getUserId(): number | null {
    const token = this.getToken();
    if (token) {
      const decoded: any = jwtDecode(token);
      const id = decoded['nameid'] ?? decoded['sub'] ?? decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      return id != null ? +id : null;
    }
    return null;
  }

  getRole(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded: any = jwtDecode(token);
      return decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    }
    return null;
  }

isAdmin(): boolean {
  return this.getRole() === 'Admin';
}

isLoggedIn(): boolean {
  return !!this.getToken();
}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  register(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, formData);
  }

  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }
}
