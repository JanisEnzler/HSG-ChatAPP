import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  private baseUrl = 'https://api-hsg-chat-app.janisenzler.ch';

  constructor(private http: HttpClient) {}

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
}
