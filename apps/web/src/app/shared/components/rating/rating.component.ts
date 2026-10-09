import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
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
