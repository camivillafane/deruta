import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (auth.isAuthenticated()) {
      <nav class="app-bottom-nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <span class="icon">🏠</span>
          <span>Inicio</span>
        </a>
        <a routerLink="/buscar" routerLinkActive="active">
          <span class="icon">🔍</span>
          <span>Buscar</span>
        </a>
        <a routerLink="/publicar" routerLinkActive="active" class="app-bottom-nav__publish">
          <span class="icon">+</span>
          <span>Publicar</span>
        </a>
        <button
          type="button"
          class="app-bottom-nav__more"
          [class.active]="menuOpen"
          (click)="menuOpen = !menuOpen"
          aria-haspopup="true"
          [attr.aria-expanded]="menuOpen"
        >
          <span class="icon">☰</span>
          <span>Más</span>
        </button>
        <a routerLink="/perfil" routerLinkActive="active">
          <span class="icon">👤</span>
          <span>Perfil</span>
        </a>
      </nav>

      @if (menuOpen) {
        <div class="app-bottom-nav__sheet" (click)="menuOpen = false">
          <div class="app-bottom-nav__sheet-content" (click)="$event.stopPropagation()">
            <a routerLink="/mis-viajes" routerLinkActive="active" (click)="menuOpen = false">
              <span class="icon">🎒</span>
              <span>Mis viajes</span>
            </a>
            <a routerLink="/necesito-viajar" routerLinkActive="active" (click)="menuOpen = false">
              <span class="icon">🧳</span>
              <span>Necesito viajar</span>
            </a>
            <a routerLink="/mensajes" routerLinkActive="active" (click)="menuOpen = false">
              <span class="icon">💬</span>
              <span>Mensajes</span>
            </a>
            <button type="button" class="app-bottom-nav__close" (click)="menuOpen = false">Cerrar</button>
          </div>
        </div>
      }
    }
  `,
  styleUrls: ['./bottom-nav.component.scss'],
})
export class BottomNavComponent {
  menuOpen = false;

  constructor(public auth: AuthService) {}
}
