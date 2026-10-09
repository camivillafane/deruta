import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
    CardComponent,
  ],
  template: `
    <div class="auth-page">
      <div class="container">
        <app-card>
          <div class="auth-card">
            <h1 class="page-title">Iniciar sesión</h1>
            <p class="page-subtitle">Ingresá a tu cuenta de DE RUTA</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
              <app-input
                formControlName="email"
                label="Email"
                type="email"
                placeholder="tu@email.com"
                id="email"
                [error]="getError('email')"
              />
              <app-input
                formControlName="password"
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                id="password"
                [error]="getError('password')"
              />

              @if (errorMessage) {
                <div class="auth-error">{{ errorMessage }}</div>
              }

              <app-button
                type="submit"
                variant="primary"
                size="lg"
                [fullWidth]="true"
                [loading]="loading"
              >
                Iniciar sesión
              </app-button>
            </form>

            <p class="auth-footer">
              ¿No tenés cuenta? <a routerLink="/registro">Registrate</a>
            </p>
          </div>
        </app-card>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al iniciar sesión';
      },
    });
  }

  getError(controlName: string): string {
    const control = this.form.get(controlName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'Este campo es obligatorio';
      if (control.errors?.['email']) return 'Email inválido';
      if (control.errors?.['minlength']) return 'Mínimo 8 caracteres';
    }
    return '';
  }
}
