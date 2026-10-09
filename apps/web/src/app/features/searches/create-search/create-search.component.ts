import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SearchesService } from '../../../core/services';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-create-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonComponent, InputComponent, CardComponent],
  template: `
    <div class="page">
      <div class="container">
        <h1 class="page-title">Necesito viajar</h1>
        <p class="page-subtitle">Publicá tu búsqueda para que conductores te encuentren</p>

        <app-card>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="create-search-form">
            <div class="form-row">
              <app-input formControlName="origin" label="Origen" placeholder="¿Desde dónde salís?" id="origin" [error]="getError('origin')" />
              <app-input formControlName="destination" label="Destino" placeholder="¿A dónde vas?" id="destination" [error]="getError('destination')" />
            </div>
            <div class="form-row">
              <app-input formControlName="date" label="Fecha" type="date" id="date" [error]="getError('date')" />
              <app-input formControlName="preferredTime" label="Horario preferido" type="time" id="preferredTime" />
            </div>
            <div class="form-row">
              <app-input formControlName="passengers" label="Pasajeros" type="number" min="1" id="passengers" [error]="getError('passengers')" />
              <div class="checkbox-field">
                <input type="checkbox" id="flexibleTime" formControlName="flexibleTime" />
                <label for="flexibleTime">Horario flexible</label>
              </div>
            </div>
            <app-input formControlName="notes" label="Comentario" placeholder="¿Algo que quieras aclarar?" id="notes" />

            @if (errorMessage) {
              <div class="form-error">{{ errorMessage }}</div>
            }

            <app-button type="submit" variant="primary" size="lg" [fullWidth]="true" [loading]="loading">
              Publicar búsqueda
            </app-button>
          </form>
        </app-card>
      </div>
    </div>
  `,
  styleUrls: ['./create-search.component.scss'],
})
export class CreateSearchComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private searchesService: SearchesService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      date: ['', Validators.required],
      preferredTime: [''],
      flexibleTime: [false],
      passengers: [1, [Validators.required, Validators.min(1)]],
      notes: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.searchesService.create(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al publicar la búsqueda';
      },
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
