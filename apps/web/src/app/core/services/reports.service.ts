import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateReportRequest {
  reportedUserId: string;
  reason: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  createReport(payload: CreateReportRequest): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }
}
