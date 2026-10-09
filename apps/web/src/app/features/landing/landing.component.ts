import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <section class="landing-hero">
      <div class="container landing-hero__content">
        <div class="landing-hero__text">
          <span class="landing-hero__tagline">Carpooling en Argentina</span>
          <h1 class="landing-hero__title">La plataforma de carpooling definitiva para encontrar tu viaje de manera fácil, rápida y segura.</h1>
          <p class="landing-hero__description">
            DE RUTA conecta conductores con pasajeros que van por el mismo camino. Ahorrá dinero en cada viaje, reducí tu huella ambiental y compartí ruta con personas verificadas. Ya sea que busques un asiento o quieras llenar los lugares libres de tu auto, acá encontrás tu próximo viaje.
          </p>
          <div class="landing-hero__actions">
            <app-button variant="primary" size="lg" routerLink="/buscar">Buscar un viaje</app-button>
            <app-button variant="secondary" size="lg" routerLink="/publicar">Publicar un viaje</app-button>
          </div>
          <div class="landing-hero__tertiary">
            <a routerLink="/necesito-viajar">Necesito viajar →</a>
          </div>
        </div>
        <div class="landing-hero__visual">
          <div class="route-card">
            <div class="route-card__header">
              <span>Concordia</span>
              <span class="route-card__arrow">→</span>
              <span>Buenos Aires</span>
            </div>
            <div class="route-card__details">
              <span>15 de octubre · 08:00 hs</span>
              <span class="route-card__price">$25.000</span>
            </div>
            <div class="route-card__driver">
              <div class="route-card__avatar">M</div>
              <div>
                <div class="route-card__name">Martín</div>
                <div class="route-card__rating">⭐ 4.9 · 18 viajes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="landing-features">
      <div class="container">
        <h2 class="landing-features__title">¿Cómo funciona?</h2>
        <div class="landing-features__grid">
          <div class="feature-card">
            <div class="feature-card__number">1</div>
            <h3>Buscá tu ruta</h3>
            <p>Ingresá origen, destino, fecha y cantidad de pasajeros.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__number">2</div>
            <h3>Elegí un viaje</h3>
            <p>Encontrá conductores que vayan por tu camino y solicitá lugar.</p>
          </div>
          <div class="feature-card">
            <div class="feature-card__number">3</div>
            <h3>Viajá junto</h3>
            <p>Acordá el aporte y los detalles directamente con el conductor.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {}
