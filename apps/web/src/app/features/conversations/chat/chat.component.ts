import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConversationsService } from '../../../core/services';
import { AuthService } from '../../../core/services/auth.service';
import { Message } from '../../../core/models';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, AvatarComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit {
  conversationId = '';
  messages: Message[] = [];
  currentUserId = '';
  form: FormGroup;
  sending = false;

  constructor(
    private route: ActivatedRoute,
    private conversationsService: ConversationsService,
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      content: ['', Validators.required],
    });
    this.currentUserId = this.authService.getCurrentUser()?.id || '';
  }

  ngOnInit(): void {
    this.conversationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadMessages();
  }

  loadMessages(): void {
    this.conversationsService.getMessages(this.conversationId).subscribe((messages) => {
      this.messages = messages;
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.sending = true;
    this.conversationsService.sendMessage(this.conversationId, this.form.value.content).subscribe(() => {
      this.sending = false;
      this.form.reset();
      this.loadMessages();
    });
  }
}
