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

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService,
    private alertsService: AlertsService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.origin = params['origin'];
      this.destination = params['destination'];
      this.departureDate = params['departureDate'];
      this.passengers = params['passengers'] || 1;
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
      })
      .subscribe({
        next: (trips) => {
          this.trips = trips;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  createAlert(): void {
    this.alertsService
      .create({
        origin: this.origin,
        destination: this.destination,
        date: this.departureDate,
      })
      .subscribe(() => {
        alert('Te avisaremos cuando aparezca un viaje');
      });
  }

  formatPrice(value: number): string {
    return value.toLocaleString('es-AR');
  }
}
