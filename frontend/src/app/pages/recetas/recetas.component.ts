import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule],
  template: `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <h2>Recetas</h2>
    <button mat-flat-button color="primary" (click)="newRecipe()">Nueva receta</button>
  </div>

  <table mat-table [dataSource]="recipes" class="mat-elevation-z1" *ngIf="recipes.length">
    <ng-container matColumnDef="name">
      <th mat-header-cell *matHeaderCellDef>Nombre</th>
      <td mat-cell *matCellDef="let r">{{r.name}}</td>
    </ng-container>

    <ng-container matColumnDef="actions">
      <th mat-header-cell *matHeaderCellDef>Acciones</th>
      <td mat-cell *matCellDef="let r">
        <button mat-stroked-button color="accent" (click)="edit(r.id)">Editar</button>
      </td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="cols"></tr>
    <tr mat-row *matRowDef="let row; columns: cols;"></tr>
  </table>
  <p *ngIf="!recipes.length">No hay recetas registradas.</p>
  `
})
export class RecetasComponent implements OnInit {
  recipes: any[] = [];
  cols = ['name', 'actions'];

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.loadRecipes();
  }

  async loadRecipes() {
    try {
      this.recipes = await this.api.get<any[]>('/recipes');
    } catch (e) {
      this.recipes = [];
    }
  }

  async newRecipe() {
    const name = prompt('Nombre de la nueva receta:');
    if (!name) return;

    await this.api.post('/recipes', { name });
    await this.loadRecipes();
  }

  edit(id: number) {
  window.location.href = `/recetas/${id}`;
}


}
