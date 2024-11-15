import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ChatBarComponent } from './chat-bar/chat-bar.component';
import { ChatHistoryComponent } from './chat-history/chat-history.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, ChatBarComponent, ChatHistoryComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'HSG-ChatAPP';
  /* Dictionary of time and, message */
  messageHistory: [string, string][] = [];

  messageSend(message: string): void {
    this.messageHistory.push([new Date().toLocaleString('de'), message]);
  }
}
