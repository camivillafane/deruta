import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <header class="app-header">
      <div class="container app-header__container">
        <a routerLink="/" class="app-header__logo" aria-label="DE RUTA - Inicio">
          <img src="/logo.svg" alt="DE RUTA" class="app-header__logo-img" width="120" height="40" />
          <span class="app-header__logo-text">DE RUTA</span>
        </a>

        <nav class="app-header__nav">
          <a routerLink="/buscar" routerLinkActive="active">Buscar</a>
          <a routerLink="/publicar" routerLinkActive="active">Publicar</a>
          <a routerLink="/necesito-viajar" routerLinkActive="active">Necesito viajar</a>
        </nav>

        <div class="app-header__actions">
          @if (auth.isAuthenticated()) {
            <a routerLink="/mis-viajes" routerLinkActive="active">Mis viajes</a>
            <a routerLink="/mensajes" routerLinkActive="active">Mensajes</a>
            <a routerLink="/perfil" routerLinkActive="active">Perfil</a>
          } @else {
            <app-button variant="ghost" routerLink="/login">Iniciar sesión</app-button>
            <app-button variant="primary" routerLink="/registro">Registrarme</app-button>
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
