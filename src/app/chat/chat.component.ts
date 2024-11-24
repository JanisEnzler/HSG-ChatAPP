import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChatBarComponent } from '../chat-bar/chat-bar.component';
import { ChatHistoryComponent } from '../chat-history/chat-history.component';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ChatBarComponent, ChatHistoryComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  @Input() history: [string, string][] = [];
  @Input() nickname = '';
  @Output() messageToSend = new EventEmitter<string>();

  messageSend(message: string): void {
    this.messageToSend.emit(message);
  }
}
