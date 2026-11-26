import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConversationsService } from '@core/services/conversations.service';
import { Conversation } from '@core/models/index';
import { CardComponent } from '@shared/components/card/card.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

@Component({
  // Angular 22 usa OnPush por defecto; este componente actualiza estado común
  // (no signals) dentro de subscribe, así que necesita Eager para refrescar la vista.
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, EmptyStateComponent, AvatarComponent],
  templateUrl: './conversations.component.html',
  styleUrl: './conversations.component.scss',
})
export class ConversationsComponent implements OnInit {
  conversations: Conversation[] = [];

  constructor(private conversationsService: ConversationsService) {}

  ngOnInit(): void {
    this.conversationsService.getMyConversations().subscribe((conversations: Conversation[]) => {
      this.conversations = conversations;
    });
  }
}
