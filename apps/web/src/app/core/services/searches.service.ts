import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TripSearch } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SearchesService {
  private readonly apiUrl = `${environment.apiUrl}/searches`;

  constructor(private http: HttpClient) {}

  create(data: Omit<TripSearch, 'id'>): Observable<TripSearch> {
    return this.http.post<TripSearch>(this.apiUrl, data);
  }
}
