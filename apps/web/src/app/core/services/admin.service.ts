import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getPendingVerifications(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/verifications/pending`);
  }

  approveIdentity(userId: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/verifications/${userId}/approve`, {});
  }

  rejectIdentity(userId: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/verifications/${userId}/reject`, {});
  }
}
