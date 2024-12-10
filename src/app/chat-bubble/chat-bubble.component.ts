import { Component, Input } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [DatePipe, NgClass],
  templateUrl: './chat-bubble.component.html',
  styleUrl: './chat-bubble.component.css'
})
export class ChatBubbleComponent {
  @Input() message: string = '';
  @Input() timestamp?: Date = new Date();
  @Input() username: string = '';
  @Input() isMe?: boolean = false;
  @Input() hideUsername?: boolean = false;
}
