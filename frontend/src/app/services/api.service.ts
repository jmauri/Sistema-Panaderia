import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  base = 'http://localhost:3000';
  constructor(private http: HttpClient) {}

  private opts() {
    const token = localStorage.getItem('token');
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  get<T = any>(path: string) {
    return firstValueFrom(this.http.get<T>(this.base + path, this.opts()));
  }

  post<T = any>(path: string, body: any) {
    // Normaliza "name" si existe
    if (body && typeof body.name === 'string') {
      body.name = body.name.trim().toUpperCase();
    }
    return firstValueFrom(this.http.post<T>(this.base + path, body, this.opts()));
  }


  put<T = any>(path: string, body: any) {
    return firstValueFrom(this.http.put<T>(this.base + path, body, this.opts()));
  }

  delete<T = any>(path: string) {
    return firstValueFrom(this.http.delete<T>(this.base + path, this.opts()));
  }
}
