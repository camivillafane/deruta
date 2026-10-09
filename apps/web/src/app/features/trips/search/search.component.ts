import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonComponent, InputComponent, CardComponent],
  template: `
    <div class="page">
      <div class="container">
        <h1 class="page-title">Buscar viaje</h1>
        <p class="page-subtitle">Encontrá a alguien que vaya hacia donde necesitás</p>

        <app-card>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="search-form">
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
            <app-input
              formControlName="departureDate"
              label="Fecha"
              type="date"
              id="departureDate"
              [error]="getError('departureDate')"
            />
            <app-input
              formControlName="passengers"
              label="Pasajeros"
              type="number"
              min="1"
              id="passengers"
              [error]="getError('passengers')"
            />

            <app-button
              type="submit"
              variant="primary"
              size="lg"
              [fullWidth]="true"
              [loading]="loading"
            >
              Buscar viajes
            </app-button>
          </form>
        </app-card>
      </div>
    </div>
  `,
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.form = this.fb.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      departureDate: ['', Validators.required],
      passengers: [1, [Validators.required, Validators.min(1)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { origin, destination, departureDate, passengers } = this.form.value;
    this.router.navigate(['/buscar/resultados'], {
      queryParams: { origin, destination, departureDate, passengers },
    });
  }

  getError(controlName: string): string {
    const control = this.form.get(controlName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'Este campo es obligatorio';
      if (control.errors?.['min']) return 'Mínimo 1 pasajero';
    }
    return '';
  }
}
