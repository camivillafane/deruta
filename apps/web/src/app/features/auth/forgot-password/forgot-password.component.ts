import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ButtonComponent, InputComponent, CardComponent],
  template: `
    <div class="auth-page">
      <div class="container">
        <app-card>
          <div class="auth-card">
            <h1 class="page-title">Recuperar contraseña</h1>
            <p class="page-subtitle">Te mandamos un link a tu email para elegir una nueva.</p>

            @if (sentMessage()) {
              <p class="auth-success" role="status">{{ sentMessage() }}</p>
              <p class="auth-footer">Revisá también la carpeta de spam. <a routerLink="/login">Volver a ingresar</a></p>
            } @else {
              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
                <app-input
                  formControlName="email"
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  id="email"
                  [error]="emailError()"
                />

                @if (errorMessage()) {
                  <div class="auth-error" role="alert">{{ errorMessage() }}</div>
                }

                <app-button type="submit" variant="primary" size="lg" [fullWidth]="true" [loading]="loading()">
                  Enviar link
                </app-button>
              </form>

              <p class="auth-footer"><a routerLink="/login">Volver a ingresar</a></p>
            }
          </div>
        </app-card>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss'],
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  readonly loading = signal(false);
  readonly sentMessage = signal('');
  readonly errorMessage = signal('');
  readonly emailError = signal('');

  onSubmit(): void {
    const control = this.form.controls.email;
    if (this.form.invalid) {
      control.markAsTouched();
      this.emailError.set(control.errors?.['required'] ? 'Este campo es obligatorio' : 'Email inválido');
      return;
    }
    this.emailError.set('');
    this.errorMessage.set('');
    this.loading.set(true);
    this.authService.forgotPassword(control.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.sentMessage.set(res.message);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 429
            ? 'Hiciste muchos pedidos seguidos. Esperá un minuto e intentá de nuevo.'
            : err.error?.message || 'No pudimos enviar el link. Intentá de nuevo.',
        );
      },
    });
  }
}
