import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, ButtonComponent],
  template: `
    <div class="page not-found">
      <div class="container not-found__container">
        <span class="not-found__icon">🚧</span>
        <h1 class="not-found__title">Página no encontrada</h1>
        <p class="not-found__text">La ruta que buscás no existe o fue movida.</p>
        <app-button variant="primary" routerLink="/">Volver al inicio</app-button>
      </div>
    </div>
  `,
  styles: [
    `
      .not-found {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;

        &__container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding-top: 48px;
          padding-bottom: 48px;
        }

        &__icon {
          font-size: 4rem;
          line-height: 1;
        }

        &__title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-violet);
        }

        &__text {
          font-size: 1rem;
          color: var(--color-text-secondary);
          max-width: 400px;
        }
      }
    `,
  ],
})
export class NotFoundComponent {}
