import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { CommonModule } from '@angular/common';
import { ChatComponent} from './chat/chat.component';
import { LoginComponent } from './login/login.component';
import { Router, NavigationEnd } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,HeaderComponent, FooterComponent, ChatComponent, LoginComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  currentRoute: string;

  constructor(public router: Router) {
    this.currentRoute = this.router.url;
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
      }
    });
  }
  title = 'HSG-ChatAPP';
  /* Array of tuples of time and message */
  messageHistory: [string, string][] = [];

  nickname = '';

  messageSend(message: string): void {
    this.messageHistory.push([new Date().toLocaleString('de'), message]);
  }

  setNickname(nickname: string): void {
    this.nickname = nickname;
    this.currentRoute = '/chat';
  }
}
