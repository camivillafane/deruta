import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  // Angular 22 usa OnPush por defecto; este componente actualiza estado común
  // (no signals) dentro de subscribe, así que necesita Eager para refrescar la vista.
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-card">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./card.component.scss'],
})
export class CardComponent {}
