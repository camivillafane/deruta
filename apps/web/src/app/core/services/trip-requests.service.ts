import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TripRequest } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TripRequestsService {
  private readonly apiUrl = `${environment.apiUrl}/trip-requests`;

  constructor(private http: HttpClient) {}

  create(data: { tripId: string; seats?: number; message?: string }): Observable<TripRequest> {
    return this.http.post<TripRequest>(this.apiUrl, data);
  }

  getMyRequests(): Observable<TripRequest[]> {
    return this.http.get<TripRequest[]>(`${this.apiUrl}/my-requests`);
  }

  getReceived(): Observable<TripRequest[]> {
    return this.http.get<TripRequest[]>(`${this.apiUrl}/received`);
  }

  updateStatus(id: string, status: TripRequest['status']): Observable<TripRequest> {
    return this.http.patch<TripRequest>(`${this.apiUrl}/${id}/status`, { status });
  }

  cancel(id: string): Observable<TripRequest> {
    return this.http.delete<TripRequest>(`${this.apiUrl}/${id}`);
  }
}
