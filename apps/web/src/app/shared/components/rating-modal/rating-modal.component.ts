import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

export interface RatingSubmitData {
  score: number;
  comment: string;
}

@Component({
  selector: 'app-rating-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './rating-modal.component.html',
  styleUrl: './rating-modal.component.scss',
})
export class RatingModalComponent {
  @Input() userName = '';
  @Input() tripOrigin = '';
  @Input() tripDestination = '';
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<RatingSubmitData>();

  score = 5;
  comment = '';
  stars = [1, 2, 3, 4, 5];
}
