import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ToastService } from '../../shared/components/toast/toast.service';

interface Report {
  id: string;
  reason: string;
  description?: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  reporter: { id: string; name: string; lastName: string; email: string };
  reportedUser: { id: string; name: string; lastName: string; email: string };
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, InputComponent],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss',
})
export class AdminReportsComponent implements OnInit {
  reports: Report[] = [];
  loading = false;
  notes: Record<string, string> = {};

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.http.get<Report[]>(`${environment.apiUrl}/reports/pending`).subscribe({
      next: (reports) => {
        this.reports = reports;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Error al cargar reportes');
      },
    });
  }

  blockAndResolve(report: Report): void {
    this.http.patch(`${environment.apiUrl}/admin/users/${report.reportedUser.id}/block`, { reason: report.reason }).subscribe({
      next: () => {
        this.resolve(report.id);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al bloquear usuario');
      },
    });
  }

  resolve(id: string): void {
    this.http.patch(`${environment.apiUrl}/reports/${id}/resolve`, { adminNotes: this.notes[id] }).subscribe({
      next: () => {
        this.toast.success('Reporte resuelto');
        this.loadReports();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al resolver reporte');
      },
    });
  }

  dismiss(id: string): void {
    this.http.patch(`${environment.apiUrl}/reports/${id}/dismiss`, { adminNotes: this.notes[id] }).subscribe({
      next: () => {
        this.toast.success('Reporte descartado');
        this.loadReports();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al descartar reporte');
      },
    });
  }
}
