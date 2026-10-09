import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rating } from '../models';

@Injectable({
  providedIn: 'root',
})
export class RatingsService {
  private readonly apiUrl = `${environment.apiUrl}/ratings`;

  constructor(private http: HttpClient) {}

  create(data: Omit<Rating, 'id' | 'reviewerId' | 'createdAt'>): Observable<Rating> {
    return this.http.post<Rating>(this.apiUrl, data);
  }
}
