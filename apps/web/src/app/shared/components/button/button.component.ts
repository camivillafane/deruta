import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  // Angular 22 usa OnPush por defecto; este componente actualiza estado común
  // (no signals) dentro de subscribe, así que necesita Eager para refrescar la vista.
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="classes"
      (click)="clicked.emit($event)"
    >
      @if (loading) {
        <span class="spinner"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  get classes(): string {
    const base = 'app-button';
    return [
      base,
      `${base}--${this.variant}`,
      `${base}--${this.size}`,
      this.fullWidth ? `${base}--full` : '',
      this.loading ? `${base}--loading` : '',
    ].join(' ');
  }
}
