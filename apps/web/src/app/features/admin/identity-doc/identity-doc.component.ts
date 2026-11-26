import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';

/**
 * Muestra una foto de licencia. Las fotos son privadas: se piden a la API con el
 * token de admin (un <img src> no puede mandar el header Authorization).
 * Las solicitudes viejas guardaban una URL externa: esas se muestran como link.
 */
@Component({
  selector: 'app-identity-doc',
  standalone: true,
  template: `
    @if (legacyUrl) {
      <a [href]="legacyUrl" target="_blank" rel="noopener noreferrer">Ver {{ label }} (link externo)</a>
    } @else if (objectUrl()) {
      <a [href]="objectUrl()" target="_blank" rel="noopener">
        <img [src]="objectUrl()" [alt]="label" />
      </a>
    } @else if (failed()) {
      <span class="identity-doc__missing">Sin foto</span>
    } @else {
      <span class="identity-doc__missing">Cargando…</span>
    }
  `,
  styles: `
    :host { flex: 1; display: block; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--color-gray); }
    img { width: 100%; height: 120px; object-fit: cover; display: block; }
    a { display: block; }
    .identity-doc__missing { display: block; padding: 16px; text-align: center; font-size: 0.875rem; color: var(--color-text-secondary); }
  `,
})
export class IdentityDocComponent implements OnInit, OnDestroy {
  @Input({ required: true }) userId = '';
  @Input({ required: true }) side: 'front' | 'back' = 'front';
  @Input() stored: string | undefined | null = '';
  @Input() label = '';

  private readonly adminService = inject(AdminService);
  readonly objectUrl = signal('');
  readonly failed = signal(false);
  legacyUrl = '';

  ngOnInit(): void {
    if (this.stored && /^https?:\/\//.test(this.stored)) {
      this.legacyUrl = this.stored;
      return;
    }
    this.adminService.getIdentityDocument(this.userId, this.side).subscribe({
      next: (blob) => this.objectUrl.set(URL.createObjectURL(blob)),
      error: () => this.failed.set(true),
    });
  }

  ngOnDestroy(): void {
    if (this.objectUrl()) {
      URL.revokeObjectURL(this.objectUrl());
    }
  }
}
