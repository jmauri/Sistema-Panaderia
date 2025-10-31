import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
  <mat-card style="max-width:400px;margin:0 auto">
    <h3>Iniciar sesión</h3>
    <form (ngSubmit)="login()">
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Ingrese email</mat-label>
        <input matInput [(ngModel)]="usernameOrEmail" name="usernameOrEmail" required />
      </mat-form-field>

      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Contraseña</mat-label>
        <input matInput type="password" [(ngModel)]="password" name="password" required />
      </mat-form-field>

      <button mat-raised-button color="primary">Ingresar</button>
    </form>
  </mat-card>
  `
})
export class LoginComponent {
  usernameOrEmail = '';
  password = '';
  constructor(private api: ApiService) {}
  async login() {
    try {
      const res: any = await this.api.post('/auth/login', { usernameOrEmail: this.usernameOrEmail, password: this.password });
      localStorage.setItem('token', res.access_token);
      alert('Login correcto');
      window.location.href = '/';
    } catch (err: any) {
      alert(err?.error?.message || 'Error');
    }
  }
}
