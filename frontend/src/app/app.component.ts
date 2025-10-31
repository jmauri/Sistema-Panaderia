import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, MatButtonModule, MatSidenavModule, MatListModule],
  template: `
  <mat-sidenav-container style="height:100vh">
    <mat-sidenav mode="side" opened *ngIf="isLoggedIn()">
      <mat-nav-list>
        <a mat-list-item routerLink="/recetas">Recetas</a>
        <a mat-list-item routerLink="/orders">Órdenes</a>
        <a mat-list-item routerLink="/supplies">Insumos</a>
        <a mat-list-item (click)="logout()">Cerrar sesión</a>
      </mat-nav-list>
    </mat-sidenav>

    <mat-sidenav-content>
      <mat-toolbar color="primary">
        Panadería
      </mat-toolbar>
      <div style="padding:16px"><router-outlet></router-outlet></div>
    </mat-sidenav-content>
  </mat-sidenav-container>
  `
})
export class AppComponent {
  constructor(private router: Router) {}

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
