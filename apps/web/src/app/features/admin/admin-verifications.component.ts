import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { User } from '../../core/models';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../shared/components/toast/toast.service';
import { IdentityDocComponent } from './identity-doc/identity-doc.component';

@Component({
  // Angular 22 usa OnPush por defecto; este componente actualiza estado común
  // (no signals) dentro de subscribe, así que necesita Eager para refrescar la vista.
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonComponent, EmptyStateComponent, IdentityDocComponent],
  templateUrl: './admin-verifications.component.html',
  styleUrl: './admin-verifications.component.scss',
})
export class AdminVerificationsComponent implements OnInit {
  users: User[] = [];
  loading = true;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.loading = true;
    this.adminService.getPendingVerifications().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Error al cargar solicitudes');
      },
    });
  }

  approve(user: User): void {
    this.adminService.approveIdentity(user.id).subscribe({
      next: () => {
        this.toastService.success('Identidad aprobada');
        this.loadPending();
      },
      error: () => this.toastService.error('Error al aprobar'),
    });
  }

  reject(user: User): void {
    this.adminService.rejectIdentity(user.id).subscribe({
      next: () => {
        this.toastService.success('Solicitud rechazada');
        this.loadPending();
      },
      error: () => this.toastService.error('Error al rechazar'),
    });
  }
}
