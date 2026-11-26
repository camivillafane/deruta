import { Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { shrinkImage } from '../../../core/utils/image';

/**
 * Campo para sacar o elegir una foto y subirla. En el celular abre la cámara o
 * la galería. Emite la clave que devuelve el servidor (o '' si se borra).
 */
@Component({
  selector: 'app-photo-upload',
  standalone: true,
  template: `
    <div class="photo-upload">
      <span class="photo-upload__label">{{ label }}</span>
      <label class="photo-upload__box" [class.photo-upload__box--error]="!!error || !!uploadError()" [attr.for]="id">
        @if (preview()) {
          <img [src]="preview()" [alt]="label" class="photo-upload__preview" />
        } @else {
          <span class="photo-upload__hint">📷 Tocá para sacar o elegir una foto</span>
        }
        @if (uploading()) {
          <span class="photo-upload__status">Subiendo…</span>
        } @else if (done()) {
          <span class="photo-upload__status photo-upload__status--ok">✓ Lista · tocá para cambiarla</span>
        }
      </label>
      <input
        class="photo-upload__input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        [id]="id"
        (change)="onFileSelected($event)"
      />
      @if (uploadError() || error) {
        <span class="photo-upload__error" role="alert">{{ uploadError() || error }}</span>
      }
    </div>
  `,
  styles: `
    .photo-upload { display: flex; flex-direction: column; gap: 6px; }
    .photo-upload__label { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
    .photo-upload__box {
      position: relative; display: flex; align-items: center; justify-content: center;
      min-height: 140px; border: 1.5px dashed var(--color-gray); border-radius: var(--radius-md);
      background: var(--color-gray-light); cursor: pointer; overflow: hidden; text-align: center;
    }
    .photo-upload__box:focus-within { border-color: var(--color-orange); }
    .photo-upload__box--error { border-color: var(--color-error); }
    .photo-upload__preview { width: 100%; max-height: 220px; object-fit: contain; }
    .photo-upload__hint { padding: 16px; font-size: 0.9375rem; color: var(--color-text-secondary); }
    .photo-upload__status {
      position: absolute; left: 0; right: 0; bottom: 0; padding: 6px;
      font-size: 0.8125rem; font-weight: 600; background: rgba(0, 0, 0, 0.6); color: #fff;
    }
    .photo-upload__status--ok { background: rgba(29, 122, 58, 0.85); }
    .photo-upload__input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
    .photo-upload__error { font-size: 0.8125rem; color: var(--color-error); }
  `,
})
export class PhotoUploadComponent implements OnDestroy {
  @Input({ required: true }) label = '';
  @Input({ required: true }) id = '';
  @Input() error = '';
  /** Función que sube el archivo y devuelve la clave. */
  @Input({ required: true }) upload!: (file: Blob) => Observable<{ key: string }>;
  @Output() uploaded = new EventEmitter<string>();

  readonly preview = signal('');
  readonly uploading = signal(false);
  readonly done = signal(false);
  readonly uploadError = signal('');

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    this.revokePreview();
    this.preview.set(URL.createObjectURL(file));
    this.uploadError.set('');
    this.done.set(false);
    this.uploading.set(true);
    this.uploaded.emit('');

    const blob = await shrinkImage(file);
    this.upload(blob).subscribe({
      next: ({ key }) => {
        this.uploading.set(false);
        this.done.set(true);
        this.uploaded.emit(key);
      },
      error: (err) => {
        this.uploading.set(false);
        const message = err?.error?.message;
        this.uploadError.set(
          err?.status === 413
            ? 'La foto es muy pesada. Probá con otra.'
            : (Array.isArray(message) ? message[0] : message) || 'No pudimos subir la foto. Probá de nuevo.',
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private revokePreview(): void {
    const url = this.preview();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
