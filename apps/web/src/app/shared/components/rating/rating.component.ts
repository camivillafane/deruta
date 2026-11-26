import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  // Angular 22 usa OnPush por defecto; este componente actualiza estado común
  // (no signals) dentro de subscribe, así que necesita Eager para refrescar la vista.
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-rating">
      @for (star of stars; track $index) {
        <span class="app-rating__star" [class.filled]="star <= value">★</span>
      }
      @if (showValue) {
        <span class="app-rating__value">{{ value.toFixed(1) }}</span>
      }
    </div>
  `,
  styleUrls: ['./rating.component.scss'],
})
export class RatingComponent {
  @Input() value = 0;
  @Input() showValue = true;

  stars = [1, 2, 3, 4, 5];
}
