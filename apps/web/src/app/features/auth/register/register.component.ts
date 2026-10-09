import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-register',
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
            <h1 class="page-title">Crear cuenta</h1>
            <p class="page-subtitle">Unite a DE RUTA y empezá a compartir viajes</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
              <app-input
                formControlName="name"
                label="Nombre"
                placeholder="Tu nombre"
                id="name"
                [error]="getError('name')"
              />
              <app-input
                formControlName="lastName"
                label="Apellido"
                placeholder="Tu apellido"
                id="lastName"
                [error]="getError('lastName')"
              />
              <app-input
                formControlName="email"
                label="Email"
                type="email"
                placeholder="tu@email.com"
                id="email"
                [error]="getError('email')"
              />
              <app-input
                formControlName="phone"
                label="Teléfono"
                placeholder="+54 9 11 1234 5678"
                id="phone"
                [error]="getError('phone')"
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
                Registrarme
              </app-button>
            </form>

            <p class="auth-footer">
              ¿Ya tenés cuenta? <a routerLink="/login">Iniciar sesión</a>
            </p>
          </div>
        </app-card>
      </div>
    </div>
  `,
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
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

    this.authService.register(this.form.value).subscribe({
      next: (response) => {
        if (response.emailVerificationCode) {
          console.log('[DEV] Email verification code:', response.emailVerificationCode);
        }
        if (response.phoneVerificationCode) {
          console.log('[DEV] Phone verification code:', response.phoneVerificationCode);
        }
        this.router.navigate(['/verificacion']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al registrarse';
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
