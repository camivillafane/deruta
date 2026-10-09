import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-empty-state">
      <div class="app-empty-state__icon">{{ icon }}</div>
      <h3 class="app-empty-state__title">{{ title }}</h3>
      @if (description) {
        <p class="app-empty-state__description">{{ description }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() icon = '🍃';
  @Input() title = '';
  @Input() description = '';
}
