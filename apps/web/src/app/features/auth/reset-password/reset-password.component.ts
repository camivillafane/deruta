import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ButtonComponent, InputComponent, CardComponent],
  template: `
    <div class="auth-page">
      <div class="container">
        <app-card>
          <div class="auth-card">
            <h1 class="page-title">Nueva contraseña</h1>

            @if (!token) {
              <p class="auth-error" role="alert">El link no es válido. Pedí uno nuevo.</p>
              <p class="auth-footer"><a routerLink="/olvide-mi-clave">Pedir otro link</a></p>
            } @else if (doneMessage()) {
              <p class="auth-success" role="status">{{ doneMessage() }}</p>
              <p class="auth-footer"><a routerLink="/login">Ingresar</a></p>
            } @else {
              <p class="page-subtitle">Elegí una contraseña de al menos 8 caracteres.</p>
              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
                <app-input
                  formControlName="password"
                  label="Contraseña nueva"
                  type="password"
                  id="password"
                  [error]="passwordError()"
                />
                <app-input
                  formControlName="confirm"
                  label="Repetí la contraseña"
                  type="password"
                  id="confirm"
                  [error]="confirmError()"
                />

                @if (errorMessage()) {
                  <div class="auth-error" role="alert">{{ errorMessage() }}</div>
                }

                <app-button type="submit" variant="primary" size="lg" [fullWidth]="true" [loading]="loading()">
                  Guardar contraseña
                </app-button>
              </form>
              @if (errorMessage()) {
                <p class="auth-footer"><a routerLink="/olvide-mi-clave">Pedir otro link</a></p>
              }
            }
          </div>
        </app-card>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss'],
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  readonly token: string = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  readonly loading = signal(false);
  readonly doneMessage = signal('');
  readonly errorMessage = signal('');
  readonly passwordError = signal('');
  readonly confirmError = signal('');

  onSubmit(): void {
    const { password, confirm } = this.form.controls;
    this.passwordError.set(
      password.errors?.['required']
        ? 'Este campo es obligatorio'
        : password.errors?.['minlength']
          ? 'Mínimo 8 caracteres'
          : password.errors?.['maxlength']
            ? 'Máximo 72 caracteres'
            : '',
    );
    this.confirmError.set(
      confirm.errors?.['required'] ? 'Este campo es obligatorio' : this.form.errors?.['mismatch'] ? 'Las contraseñas no coinciden' : '',
    );
    if (this.form.invalid) {
      return;
    }

    this.errorMessage.set('');
    this.loading.set(true);
    this.authService.resetPassword(this.token, password.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.doneMessage.set(res.message);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err.error?.message;
        this.errorMessage.set(
          Array.isArray(message) ? 'El link no es válido. Pedí uno nuevo.' : message || 'No pudimos cambiar la contraseña.',
        );
      },
    });
  }
}
