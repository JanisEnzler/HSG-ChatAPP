import { NgFor } from '@angular/common';
import { Component, Input, ViewChild, DestroyRef, ElementRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatBubbleComponent } from '../chat-bubble/chat-bubble.component';
import { tap, finalize, catchError, EMPTY } from 'rxjs';
import { ApiService } from '../api.service';
import { ChatMessage } from '../shared/models/chat-message';

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [ChatBubbleComponent],
  templateUrl: './chat-history.component.html',
  styleUrl: './chat-history.component.css'
})
export class ChatHistoryComponent {
  @Input() chatID?: string;



  chatMessages: ChatMessage[] = [];
  errorMessage!: string;
  // If the chatID is not null, do a polling every second to get the chat history
  // of the chat with the chatID
  @ViewChild('scrollFrame') private scrollFrame!: ElementRef<HTMLElement>;

  private destroyRef = inject(DestroyRef);
  private apiService = inject(ApiService );
  private pollInterval = 2000;

  ngOnInit(): void {
    this.getHistory();

    setInterval(() => {
      this.getHistory();
    }, this.pollInterval);
  }

  private getHistory(): void {
    if (!this.chatID) {
      return
    }
    this.apiService.getGroupMessages(this.chatID)
      .pipe(
        tap((response: ChatMessage[]) => {
          // Check if the response contains any new messages
          if (response.length === this.chatMessages.length) {
            return;
          }
          this.chatMessages = response;
          console.log('chatMessages', this.chatMessages);
          setTimeout(() => this.scrollTo(), 0);
        }),
        takeUntilDestroyed(this.destroyRef),
        catchError((error: Error) => {
          this.errorMessage = error.message;
          console.error(error);
          return EMPTY;
        }),
        finalize(() => console.log('done!'))
      )
      .subscribe();
  }

  private scrollTo(): void {
    console.log(this.scrollFrame.nativeElement.scrollHeight);
    this.scrollFrame?.nativeElement?.scroll({
      top: this.scrollFrame.nativeElement.scrollHeight,
      left: 0,
      behavior: 'smooth',
    });
  }

  ngOnChanges(): void {
    if (this.chatID) {
      this.getHistory();
    }
  }
}

