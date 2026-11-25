import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TripsService } from '../../../core/services/trips.service';
import { AlertsService } from '../../../core/services/alerts.service';
import { Trip } from '../../../core/models';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { RatingComponent } from '../../../shared/components/rating/rating.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonComponent, EmptyStateComponent, RatingComponent],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss',
})
export class ResultsComponent implements OnInit {
  trips: Trip[] = [];
  loading = true;
  origin = '';
  destination = '';
  departureDate = '';
  passengers = 1;
  page = 1;
  limit = 10;
  total = 0;

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService,
    private alertsService: AlertsService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.origin = params['origin'];
      this.destination = params['destination'];
      this.departureDate = params['departureDate'];
      this.passengers = params['passengers'] || 1;
      this.page = 1;
      this.search();
    });
  }

  search(): void {
    this.loading = true;
    this.tripsService
      .search({
        origin: this.origin,
        destination: this.destination,
        departureDate: this.departureDate,
        passengers: this.passengers,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (response) => {
          this.trips = response.data;
          this.total = response.total;
          this.page = response.page;
          this.limit = response.limit;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  goToPage(page: number): void {
    this.page = page;
    this.search();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  createAlert(): void {
    this.alertsService
      .create({
        origin: this.origin,
        destination: this.destination,
        date: this.departureDate,
      })
      .subscribe({
        next: () => {
          this.toastService.success('Te avisaremos cuando aparezca un viaje');
        },
        error: (err) => {
          const message = err?.error?.message || 'No se pudo crear la alerta';
          this.toastService.error(message);
        },
      });
  }

  formatPrice(value: number): string {
    return value.toLocaleString('es-AR');
  }
}
