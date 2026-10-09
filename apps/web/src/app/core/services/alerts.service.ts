import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  private readonly apiUrl = `${environment.apiUrl}/alerts`;

  constructor(private http: HttpClient) {}

  create(data: Omit<Alert, 'id' | 'active'>): Observable<Alert> {
    return this.http.post<Alert>(this.apiUrl, data);
  }
}
