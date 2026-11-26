import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  // Angular 22 usa OnPush por defecto; este componente actualiza estado común
  // (no signals) dentro de subscribe, así que necesita Eager para refrescar la vista.
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <header class="app-header">
      <div class="container app-header__container">
        <a routerLink="/" class="app-header__logo" aria-label="DE RUTA - Inicio">
          <img src="/logo_deruta.png?v=2" alt="DE RUTA" class="app-header__logo-img" width="40" height="40" />
          <span class="app-header__logo-text">DE RUTA</span>
        </a>

        <nav class="app-header__nav">
          <a routerLink="/buscar" routerLinkActive="active">Buscar</a>
          <a routerLink="/publicar" routerLinkActive="active">Publicar</a>
          <a routerLink="/necesito-viajar" routerLinkActive="active">Necesito viajar</a>
        </nav>

        <div class="app-header__actions" [class.app-header__actions--guest]="!auth.isAuthenticated()">
          @if (auth.isAuthenticated()) {
            <a routerLink="/mis-viajes" routerLinkActive="active">Mis viajes</a>
            <a routerLink="/mensajes" routerLinkActive="active">Mensajes</a>
            <a routerLink="/perfil" routerLinkActive="active">Perfil</a>
          } @else {
            <!-- Visibles también en mobile: sin sesión no hay barra inferior, y este es
                 el único acceso a login/registro. -->
            <app-button variant="ghost" size="sm" routerLink="/login">Ingresar</app-button>
            <app-button variant="primary" size="sm" routerLink="/registro">Registrarme</app-button>
          }
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  constructor(public auth: AuthService) {}
}
