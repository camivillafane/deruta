import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  // Angular 22 usa OnPush por defecto; este componente actualiza estado común
  // (no signals) dentro de subscribe, así que necesita Eager para refrescar la vista.
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-avatar" [style.width.px]="size" [style.height.px]="size">
      @if (src) {
        <img [src]="src" [alt]="name" />
      } @else {
        <span [style.fontSize.px]="size * 0.4">{{ initials }}</span>
      }
    </div>
  `,
  styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent {
  @Input() src = '';
  @Input() name = '';
  @Input() size = 40;

  get initials(): string {
    return this.name
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
