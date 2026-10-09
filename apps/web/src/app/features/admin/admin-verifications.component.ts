import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { User } from '../../core/models';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, EmptyStateComponent],
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
