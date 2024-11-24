import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nickname',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './nickname.component.html',
  styleUrl: './nickname.component.css'
})
export class NicknameComponent {
  @Output() nicknameCreate = new EventEmitter<string>();

  chatNickname = '';
  errorMessage!: string;

  createNickname(nickname: string): void {
    nickname = nickname.replace(/(\r\n|\r|\n)/, '');
    nickname = nickname.trim();

    if (!nickname) {
      this.errorMessage = 'Please add a nickname!';

      return;
    }


    this.nicknameCreate.emit(nickname);
    this.chatNickname = '';
  }
}
