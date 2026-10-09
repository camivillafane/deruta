import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TripsService, VehiclesService } from '../../../core/services';
import { Vehicle } from '../../../core/models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-create-trip',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    CardComponent,
  ],
  template: `
    <div class="page">
      <div class="container">
        <h1 class="page-title">¿Vas a viajar? Compartí tu ruta.</h1>
        <p class="page-subtitle">Publicá tu viaje y encontrá pasajeros</p>

        <app-card>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="create-trip-form">
            <div class="form-row">
              <app-input
                formControlName="origin"
                label="Origen"
                placeholder="¿Desde dónde salís?"
                id="origin"
                [error]="getError('origin')"
              />
              <app-input
                formControlName="destination"
                label="Destino"
                placeholder="¿A dónde vas?"
                id="destination"
                [error]="getError('destination')"
              />
            </div>

            <div class="form-row">
              <app-input
                formControlName="departureDate"
                label="Fecha"
                type="date"
                id="departureDate"
                [error]="getError('departureDate')"
              />
              <app-input
                formControlName="departureTime"
                label="Hora"
                type="time"
                id="departureTime"
                [error]="getError('departureTime')"
              />
            </div>

            <div class="form-row">
              <app-input
                formControlName="availableSeats"
                label="Lugares disponibles"
                type="number"
                min="1"
                id="availableSeats"
                [error]="getError('availableSeats')"
              />
              <app-input
                formControlName="contributionPerPassenger"
                label="Aporte por pasajero"
                type="number"
                min="0"
                id="contributionPerPassenger"
                [error]="getError('contributionPerPassenger')"
              />
            </div>

            <app-input
              formControlName="meetingPoint"
              label="Punto de encuentro"
              placeholder="Ej: centro de Concordia"
              id="meetingPoint"
            />

            <app-select
              formControlName="vehicleId"
              label="Vehículo"
              [options]="vehicleOptions"
              placeholder="Seleccioná tu vehículo"
              id="vehicleId"
            />

            <app-input
              formControlName="notes"
              label="Notas"
              placeholder="Ej: Salgo desde el centro de Concordia."
              id="notes"
            />

            @if (errorMessage) {
              <div class="form-error">{{ errorMessage }}</div>
            }

            <app-button
              type="submit"
              variant="primary"
              size="lg"
              [fullWidth]="true"
              [loading]="loading"
            >
              Publicar viaje
            </app-button>
          </form>
        </app-card>
      </div>
    </div>
  `,
  styleUrls: ['./create.component.scss'],
})
export class CreateTripComponent implements OnInit {
  form: FormGroup;
  vehicles: Vehicle[] = [];
  vehicleOptions: { value: string; label: string }[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private tripsService: TripsService,
    private vehiclesService: VehiclesService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      departureDate: ['', Validators.required],
      departureTime: ['', Validators.required],
      availableSeats: [1, [Validators.required, Validators.min(1)]],
      contributionPerPassenger: [0, [Validators.required, Validators.min(0)]],
      meetingPoint: [''],
      vehicleId: ['', Validators.required],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.vehiclesService.getMyVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.vehicleOptions = vehicles.map((v) => ({
          value: v.id,
          label: `${v.brand} ${v.model} (${v.color})`,
        }));
      },
      error: () => {
        this.errorMessage = 'Primero debés agregar un vehículo';
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.tripsService.create(this.form.value).subscribe({
      next: (trip) => {
        this.router.navigate(['/viajes', trip.id]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al publicar el viaje';
      },
    });
  }

  getError(controlName: string): string {
    const control = this.form.get(controlName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'Este campo es obligatorio';
      if (control.errors?.['min']) return 'Valor inválido';
    }
    return '';
  }
}
