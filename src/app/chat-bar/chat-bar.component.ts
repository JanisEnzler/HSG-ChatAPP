import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-bar.component.html',
  styleUrl: './chat-bar.component.css',
})
export class ChatBarComponent {
  @Input () nickname!: string;

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

    console.log('Nickname: ', this.nickname);

    if (!this.nickname) {
      this.errorMessage = 'Please add a nickname!';

      return;
    }

    const messageToSend = `${message}`;

    this.messageToSend.emit(messageToSend);
    this.chatMessage = '';
  }
}