import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip, TripRequest } from '../models';

export interface SearchTripsParams {
  origin: string;
  destination: string;
  departureDate: string;
  passengers?: number;
}

export interface CreateTripData {
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  meetingPoint?: string;
  availableSeats: number;
  contributionPerPassenger: number;
  notes?: string;
  vehicleId: string;
}

@Injectable({
  providedIn: 'root',
})
export class TripsService {
  private readonly apiUrl = `${environment.apiUrl}/trips`;

  constructor(private http: HttpClient) {}

  search(params: SearchTripsParams): Observable<Trip[]> {
    const query: Record<string, string> = {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
    };
    if (params.passengers) {
      query['passengers'] = String(params.passengers);
    }
    return this.http.get<Trip[]>(`${this.apiUrl}/search`, { params: query });
  }

  findAll(filters?: { origin?: string; destination?: string; date?: string }): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl, { params: filters as Record<string, string> });
  }

  getById(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateTripData): Observable<Trip> {
    return this.http.post<Trip>(this.apiUrl, data);
  }

  getMyTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/driver/my-trips`);
  }

  complete(id: string): Observable<Trip> {
    return this.http.post<Trip>(`${this.apiUrl}/${id}/complete`, {});
  }

  getMyRequest(id: string): Observable<{ request: TripRequest | null }> {
    return this.http.get<{ request: TripRequest | null }>(`${this.apiUrl}/${id}/me`);
  }
}
