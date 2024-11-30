import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { CommonModule, NgIf } from '@angular/common';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage: string | null = null;
  passwordVisible: boolean = false;

  constructor(private apiService: ApiService) {}

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  testPassword(password: string): boolean {
    if (!password) {
      return false;
    }
    // Check password validity
    if (!/^[a-zA-Z0-9!@#$%^&*]+$/.test(password)) {
      return false;
    }
    // Password should be between 8 and 32 characters long
    if (password.length < 8 || password.length > 32) {
      return false;
    }
    return true;
  }

  testUsername(username: string): boolean {
    if (!username) {
      return false;
    }
    // Check username validity
    if (!/^[a-zA-Z0-9_ -]+$/.test(username)) {
      return false;
    }
    // Username should be between 4 and 16 characters long
    if (username.length < 3 || username.length > 20) {
      return false;
    }
    return true;
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = null;
    }, 10000); // 10 seconds
  }

  login(username: string, password: string): void {
    username = username.replace(/(\r\n|\r|\n)/, '');
    username = username.trim();
    password = password.replace(/(\r\n|\r|\n)/, '');
    password = password.trim();

    // Validity of username and password are also checked on the client side to reduce server load
    if (!this.testUsername(username)) {
      this.showError('Invalid username!');
      return;
    }
    if (!this.testPassword(password)) {
      this.showError('Invalid password!');
      return;
    }

    this.apiService.login(username, password).subscribe({
      next: response => {
        console.log('Login successful', response);
        localStorage.setItem('token', response.token);
        // Redirect the user to the chat page
      },
      error: error => {
        console.error('Login failed', error);
        this.showError(error.error || 'An error occurred during login.');
      }
    });
  }

  signup(username: string, password: string): void {
    username = username.replace(/(\r\n|\r|\n)/, '');
    username = username.trim();
    password = password.replace(/(\r\n|\r|\n)/, '');
    password = password.trim();

    // Validity of username and password are also checked on the client side to reduce server load
    if (!this.testUsername(username)) {
      this.showError('Invalid username!');
      return;
    }
    if (!this.testPassword(password)) {
      this.showError('Invalid password!');
      return;
    }
    
    this.apiService.signup(username, password).subscribe({
      next: response => {
        console.log('Signup successful', response);
        localStorage.setItem('token', response.token);
      },
      error: error => {
        console.error('Signup failed', error);
        this.showError(error.error || 'An error occurred during signup.');
      }
    });
  }
}