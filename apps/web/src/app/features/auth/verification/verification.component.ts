import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, CardComponent],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.scss',
})
export class VerificationComponent implements OnInit {
  step: 'email' | 'phone' | 'identity' | 'pending' | 'done' = 'email';
  emailForm: FormGroup;
  phoneForm: FormGroup;
  identityForm: FormGroup;
  loading = false;
  user: ReturnType<AuthService['getCurrentUser']> = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
  ) {
    this.emailForm = this.fb.group({ code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]] });
    this.phoneForm = this.fb.group({ code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]] });
    this.identityForm = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(8)]],
      licenseNumber: ['', [Validators.required, Validators.minLength(5)]],
      licenseFrontImage: ['', Validators.required],
      licenseBackImage: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
    this.setInitialStep();
  }

  private setInitialStep(): void {
    if (!this.user?.emailVerified) {
      this.step = 'email';
    } else if (!this.user?.phoneVerified) {
      this.step = 'phone';
    } else if (!this.user?.identityVerified && !this.user?.identitySubmittedAt) {
      this.step = 'identity';
    } else if (this.user?.identitySubmittedAt && !this.user?.identityVerified) {
      this.step = 'pending';
    } else {
      this.step = 'done';
    }
  }

  verifyEmail(): void {
    if (this.emailForm.invalid) return;
    this.loading = true;
    this.authService.verifyEmail(this.emailForm.value.code).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Email verificado');
        this.refreshUser();
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Código incorrecto');
      },
    });
  }

  verifyPhone(): void {
    if (this.phoneForm.invalid) return;
    this.loading = true;
    this.authService.verifyPhone(this.phoneForm.value.code).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Teléfono verificado');
        this.refreshUser();
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Código incorrecto');
      },
    });
  }

  submitIdentity(): void {
    if (this.identityForm.invalid) return;
    this.loading = true;
    this.authService.submitIdentity(this.identityForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Documentación enviada para revisión');
        this.refreshUser();
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Error al enviar documentación');
      },
    });
  }

  resendEmail(): void {
    this.authService.resendEmail().subscribe({
      next: (res) => {
        if (res.emailVerificationCode) {
          this.toastService.info(`Código de email (dev): ${res.emailVerificationCode}`);
        } else {
          this.toastService.success('Código reenviado');
        }
      },
      error: (err) => this.toastService.error(err.error?.message || 'Error al reenviar'),
    });
  }

  resendPhone(): void {
    this.authService.resendPhone().subscribe({
      next: (res) => {
        if (res.phoneVerificationCode) {
          this.toastService.info(`Código de teléfono (dev): ${res.phoneVerificationCode}`);
        } else {
          this.toastService.success('Código reenviado');
        }
      },
      error: (err) => this.toastService.error(err.error?.message || 'Error al reenviar'),
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goPublish(): void {
    this.router.navigate(['/publicar']);
  }

  getError(form: FormGroup, controlName: string): string {
    const control = form.get(controlName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'Este campo es obligatorio';
      if (control.errors?.['minlength'] || control.errors?.['maxlength']) return 'Debe tener 6 dígitos';
      if (controlName === 'dni' && (control.errors?.['minlength'] || control.errors?.['maxlength'])) return 'DNI inválido';
    }
    return '';
  }

  private refreshUser(): void {
    this.authService.refreshUser().subscribe({
      next: (user) => {
        this.user = user;
        this.setInitialStep();
      },
      error: () => this.toastService.error('Error al actualizar el perfil'),
    });
  }
}
