import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './shared/models/user';
import { Group } from './shared/models/group';
import { ChatMessage } from './shared/models/chat-message';

interface LoginResponse {
  token: string;
}


@Injectable({
  providedIn: 'root'
})

export class ApiService {
  private baseUrl = 'https://api-hsg-chat-app.janisenzler.ch';

  constructor(private http: HttpClient) {}

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }

  login(username: string, password: string): Observable<LoginResponse> {
    const url = `${this.baseUrl}/login`;
    const body = { username, password };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
    return this.http.post<LoginResponse>(url, body, { headers });
  }

  signup(username: string, password: string): Observable<LoginResponse>  {
    const url = `${this.baseUrl}/signup`;
    const body = { username, password };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<LoginResponse>(url, body, { headers });
  }
  
  validateToken(): Observable<User> {
    const url = `${this.baseUrl}/validate`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.get<any>(url, { headers });
  }

  sendMessageToGroup(groupId: string, message: string): Observable<any> {
    const url = `${this.baseUrl}/chats/${groupId}`;
    const body = { message };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.post<any>(url, body, { headers });
  }

  createGroup(groupName: string, userIds: string[]): Observable<any> {
    const url = `${this.baseUrl}/chats`;
    const body = { groupName, userIds };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.post<any>(url, body, { headers });
  }

  getUserGroups(): Observable<Group[]> {
    const url = `${this.baseUrl}/chats`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.get<any>(url, { headers });
  }

  getGroupMessages(groupId: string): Observable<ChatMessage[]> {
    const url = `${this.baseUrl}/chats/${groupId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.get<any>(url, { headers });
  }

  getUsers(): Observable<User[]> {
    const url = `${this.baseUrl}/users`;
    return this.http.get<User[]>(url);
  }
}
