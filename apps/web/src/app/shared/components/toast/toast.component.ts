import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription = new Subscription();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.toastService.getToasts().subscribe((toast) => {
        this.toasts.push(toast);
        if (toast.duration !== 0) {
          setTimeout(() => this.remove(toast.id), toast.duration || 4000);
        }
      }),
    );
    this.subscription.add(
      this.toastService.getDismissals().subscribe((id) => {
        this.remove(id);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}
