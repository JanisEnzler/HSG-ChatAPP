import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-chat-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-bar.component.html',
  styleUrl: './chat-bar.component.css',
})
export class ChatBarComponent {
  
  private apiService = inject(ApiService );

  @Input () chatID?: string;

  chatMessage = '';
  errorMessage!: string;

  addMessage(message: string): void {
    message = message.replace(/(\r\n|\r|\n)/, '');
    message = message.trim();

    if (!message) {
      this.errorMessage = 'Please add a message!';

      return;
    }

    if (!this.chatID) {
      this.errorMessage = 'Please select a chat!';
      return;
    }
    this.apiService.sendMessageToGroup(this.chatID, message).subscribe(
      (response) => {
        this.chatMessage = '';
      },
      (error) => {
        this.errorMessage = 'An error occurred while sending the message';
      }
    );
  }
}