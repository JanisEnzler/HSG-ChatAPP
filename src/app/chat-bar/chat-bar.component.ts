import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-chat-bar',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './chat-bar.component.html',
  styleUrl: './chat-bar.component.css',
})
export class ChatBarComponent {
  
  private apiService = inject(ApiService );

  @Input () chatID?: string;

  chatMessage = '';
  errorMessage: string | null = null;

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = null;
    }, 10000); // 10 seconds
  }

  addMessage(message: string): void {
    message = message.replace(/(\r\n|\r|\n)/, '');
    message = message.trim();

    if (!message) {
      this.showError('Please add a message!');
      return;
    }

    if (!this.chatID) {
      this.showError('Please select a chat!');
      return;
    }

    if (message.length > 2000) {
      this.showError('Message has to be less than 2000 characters');
      return;
    }

    this.apiService.sendMessageToGroup(this.chatID, message).subscribe(
      (response) => {
        this.chatMessage = '';
      },
      (error) => {
        this.showError(error.error || 'An error occurred while sending the message');
      }
    );
  }
}