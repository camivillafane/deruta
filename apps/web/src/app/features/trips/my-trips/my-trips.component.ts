import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TripsService } from '@core/services/trips.service';
import { TripRequestsService } from '@core/services/trip-requests.service';
import { RatingsService } from '@core/services/ratings.service';
import { AuthService } from '@core/services/auth.service';
import { Trip, TripRequest } from '@core/models/index';
import { CardComponent } from '@shared/components/card/card.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { BadgeComponent, BadgeVariant } from '@shared/components/badge/badge.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { RatingModalComponent, RatingSubmitData } from '@shared/components/rating-modal/rating-modal.component';

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonComponent, BadgeComponent, EmptyStateComponent, RatingModalComponent],
  templateUrl: './my-trips.component.html',
  styleUrl: './my-trips.component.scss',
})
export class MyTripsComponent implements OnInit {
  activeTab: 'passenger' | 'driver' = 'passenger';
  myRequests: TripRequest[] = [];
  myTrips: Trip[] = [];
  showRatingModal = false;
  ratingTripId = '';
  ratingUserId = '';
  ratingUserName = '';
  ratingTripOrigin = '';
  ratingTripDestination = '';
  ratingLoading = false;

  constructor(
    private tripsService: TripsService,
    private tripRequestsService: TripRequestsService,
    private ratingsService: RatingsService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.tripRequestsService.getMyRequests().subscribe((requests) => {
      this.myRequests = requests;
    });
    this.tripsService.getMyTrips().subscribe((trips) => {
      this.myTrips = trips;
    });
  }

  updateRequest(id: string, status: TripRequest['status']): void {
    this.tripRequestsService.updateStatus(id, status).subscribe(() => this.loadData());
  }

  cancelRequest(id: string): void {
    this.tripRequestsService.cancel(id).subscribe(() => this.loadData());
  }

  getStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'accepted':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      cancelled: 'Cancelada',
      active: 'Activo',
      completed: 'Completado',
    };
    return labels[status] || status;
  }

  canRate(trip: Trip, request?: TripRequest): boolean {
    if (trip.status !== 'completed' && new Date(trip.departureDate) >= new Date()) {
      return false;
    }
    const otherUserId = request ? request.passengerId : trip.driverId;
    return otherUserId !== this.authService.getCurrentUser()?.id;
  }

  openRating(trip: Trip, request?: TripRequest): void {
    this.ratingTripId = trip.id;
    this.ratingUserId = request ? request.passengerId : trip.driverId;
    this.ratingUserName = request
      ? `${request.passenger?.name} ${request.passenger?.lastName}`
      : `${trip.driver.name} ${trip.driver.lastName}`;
    this.ratingTripOrigin = trip.origin;
    this.ratingTripDestination = trip.destination;
    this.showRatingModal = true;
  }

  closeRating(): void {
    this.showRatingModal = false;
  }

  submitRating(data: RatingSubmitData): void {
    this.ratingLoading = true;
    this.ratingsService
      .create({
        tripId: this.ratingTripId,
        reviewedUserId: this.ratingUserId,
        score: data.score,
        comment: data.comment,
      })
      .subscribe(() => {
        this.ratingLoading = false;
        this.closeRating();
        this.loadData();
      });
  }
}
