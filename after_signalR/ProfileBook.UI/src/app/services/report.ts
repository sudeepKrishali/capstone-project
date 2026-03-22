import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Report } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private baseUrl = `${environment.apiUrl}/Report`;

  constructor(private http: HttpClient) {}

  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.baseUrl);
  }

  reportUser(reportedUserId: number, reportingUserId: number, reason?: string): Observable<unknown> {
    return this.http.post(this.baseUrl, {
      reportedUserId,
      reportingUserId,
      reason: reason ?? undefined,
    });
  }
}
