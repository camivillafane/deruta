import { Component, Input, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="app-input">
      @if (label) {
        <label [for]="id" class="app-input__label">{{ label }}</label>
      }
      <input
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="app-input__field"
        [class.app-input__field--error]="hasError"
      />
      @if (error) {
        <span class="app-input__error">{{ error }}</span>
      }
    </div>
  `,
  styleUrls: ['./input.component.scss'],
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: string = 'text';
  @Input() placeholder = '';
  @Input() id = '';
  @Input() error = '';
  @Input() disabled = false;

  value: string | number = '';

  get hasError(): boolean {
    return !!this.error;
  }

  get isNumeric(): boolean {
    return this.type === 'number';
  }

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  onChange: (value: string | number | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | number | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;

    if (this.isNumeric) {
      const numericValue = this.value === '' ? null : Number(this.value);
      this.onChange(numericValue);
      return;
    }

    this.onChange(this.value);
  }
}
