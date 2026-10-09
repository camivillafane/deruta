import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TripsService, TripRequestsService } from '../../../core/services';
import { AuthService } from '../../../core/services/auth.service';
import { Trip, TripRequest } from '../../../core/models';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { RatingComponent } from '../../../shared/components/rating/rating.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonComponent, BadgeComponent, RatingComponent, AvatarComponent],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
})
export class TripDetailComponent implements OnInit {
  trip: Trip | null = null;
  requesting = false;
  myRequest: TripRequest | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripsService: TripsService,
    private tripRequestsService: TripRequestsService,
    private authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tripsService.getById(id).subscribe((trip) => {
        this.trip = trip;
      });
      if (this.authService.isAuthenticated()) {
        this.tripsService.getMyRequest(id).subscribe(({ request }) => {
          this.myRequest = request;
        });
      }
    }
  }

  canRequest(): boolean {
    if (!this.authService.isAuthenticated()) return false;
    if (this.trip?.driverId === this.authService.getCurrentUser()?.id) return false;
    return !this.alreadyRequested();
  }

  alreadyRequested(): boolean {
    return !!this.myRequest;
  }

  requestSeat(): void {
    if (!this.trip) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.requesting = true;
    this.tripRequestsService.create({ tripId: this.trip.id }).subscribe({
      next: () => {
        this.requesting = false;
        this.toastService.success('Solicitud enviada');
        this.router.navigate(['/mis-viajes']);
      },
      error: (err) => {
        this.requesting = false;
        const message = err?.error?.message || 'Error al enviar la solicitud';
        this.toastService.error(message);
      },
    });
  }

  formatPrice(value: number): string {
    return value.toLocaleString('es-AR');
  }
}
