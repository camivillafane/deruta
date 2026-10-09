import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonComponent, InputComponent, CardComponent],
  template: `
    <section class="landing-hero">
      <div class="container">
        <div class="landing-hero__top">
          <div class="landing-hero__intro">
            <h1 class="landing-hero__title">La plataforma de carpooling definitiva para encontrar tu viaje de manera fácil, rápida y segura.</h1>
            <div class="landing-hero__actions">
              <app-button variant="secondary" size="lg" routerLink="/publicar">Publicar un viaje</app-button>
            </div>
          </div>
          <div class="landing-hero__visual">
            <app-card>
              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="hero-search-form">
                <h3 class="hero-search-form__title">¿A dónde vas?</h3>
                <div class="hero-search-form__row">
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
                <div class="hero-search-form__row">
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
                </div>
                <app-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [fullWidth]="true"
                >
                  Buscar viajes
                </app-button>
              </form>
            </app-card>
          </div>
        </div>

        <p class="landing-hero__description">
          DE RUTA conecta conductores con pasajeros que van por el mismo camino. Ahorrá dinero en cada viaje, reducí tu huella ambiental y compartí ruta con personas verificadas. Ya sea que busques un asiento o quieras llenar los lugares libres de tu auto, acá encontrás tu próximo viaje.
        </p>
      </div>
    </section>

    <section class="landing-features">
      <div class="container">
        <h2 class="landing-features__title">¿Cómo funciona?</h2>
        <div class="landing-features__grid">
          <div class="feature-card">
            <div class="feature-card__number">1</div>
            <h3>Buscá tu ruta</h3>
            <p>Ingresá origen, destino, fecha y cantidad de pasajeros.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__number">2</div>
            <h3>Elegí un viaje</h3>
            <p>Encontrá conductores que vayan por tu camino y solicitá lugar.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__number">3</div>
            <h3>Viajá junto</h3>
            <p>Acordá el aporte y los detalles directamente con el conductor.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {
  form: FormGroup;

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
