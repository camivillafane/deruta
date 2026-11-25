import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts$ = new Subject<Toast>();
  private dismiss$ = new Subject<string>();

  add(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = `${Date.now()}-${Math.random()}`;
    this.toasts$.next({ id, message, type, duration });
  }

  success(message: string, duration?: number): void {
    this.add(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.add(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    this.add(message, 'info', duration);
  }

  getToasts() {
    return this.toasts$.asObservable();
  }

  dismiss(id: string): void {
    this.dismiss$.next(id);
  }

  getDismissals() {
    return this.dismiss$.asObservable();
  }
}
