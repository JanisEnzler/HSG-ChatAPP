import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ChatBarComponent } from './chat-bar/chat-bar.component';
import { ChatHistoryComponent } from './chat-history/chat-history.component';
import { NicknameComponent } from './nickname/nickname.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, ChatBarComponent, ChatHistoryComponent, NicknameComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'HSG-ChatAPP';
  /* Array of tuples of time and message */
  messageHistory: [string, string][] = [];

  nickname = '';

  messageSend(message: string): void {
    this.messageHistory.push([new Date().toLocaleString('de'), message]);
  }


}
