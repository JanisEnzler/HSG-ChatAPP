import { NgIf } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-bar.component.html',
  styleUrl: './chat-bar.component.css',
})
export class ChatBarComponent {
  @Output() messageToSend = new EventEmitter<string>();

  chatMessage = '';
  errorMessage!: string;

  addMessage(message: string): void {
    message = message.replace(/(\r\n|\r|\n)/, '');
    message = message.trim();

    if (!message) {
      this.errorMessage = 'Please add a message!';

      return;
    }

    const messageToSend = `${message}`;

    this.messageToSend.emit(messageToSend);
    this.chatMessage = '';
  }
}