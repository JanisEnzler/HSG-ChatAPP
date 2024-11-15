import { NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ChatBubbleComponent } from '../chat-bubble/chat-bubble.component';

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [NgFor, ChatBubbleComponent],
  templateUrl: './chat-history.component.html',
  styleUrl: './chat-history.component.css'
})
export class ChatHistoryComponent {
  @Input() history: [string, string][] = [];
}
