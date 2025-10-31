// frontend/src/app/pages/recetas/receta-detalle.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-receta-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="container">
      <div class="header">
        <h2>Editar Receta</h2>
        <button mat-stroked-button color="primary" (click)="back()">
          Volver
        </button>
      </div>

      <div *ngIf="recipe">
        <mat-form-field appearance="fill" class="full">
          <mat-label>Nombre</mat-label>
          <input matInput [(ngModel)]="recipe.name" />
        </mat-form-field>

        <mat-form-field appearance="fill" class="full">
          <mat-label>Descripción</mat-label>
          <input matInput [(ngModel)]="recipe.description" />
        </mat-form-field>

        <h3>Ingredientes</h3>
        <div class="table-container">
          <table
            mat-table
            [dataSource]="recipe.ingredients"
            class="mat-elevation-z1"
            *ngIf="recipe.ingredients?.length"
          >
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Ingrediente</th>
              <td mat-cell *matCellDef="let i">
                <input
                  matInput
                  [(ngModel)]="i.name"
                  placeholder="Ingrediente"
                />
              </td>
            </ng-container>

            <ng-container matColumnDef="mode">
              <th mat-header-cell *matHeaderCellDef>Modo</th>
              <td mat-cell *matCellDef="let i">
                <mat-form-field appearance="fill" style="width:140px;">
                  <mat-select [(ngModel)]="i.mode">
                    <mat-option value="percent">% Panadero</mat-option>
                    <mat-option value="fixed">Cantidad fija</mat-option>
                    <mat-option value="unit">Por unidad</mat-option>
                  </mat-select>
                </mat-form-field>
              </td>
            </ng-container>

            <ng-container matColumnDef="value">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let i">
                <input
                  matInput
                  type="number"
                  [(ngModel)]="i.value"
                  style="width:90px;"
                />
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let i; let idx = index">
                <button mat-icon-button color="warn" (click)="removeIngredient(idx)">
                  🗑️
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
          </table>
        </div>

        <div class="actions">
          <button mat-stroked-button color="accent" (click)="addIngredient()">
            ➕ Agregar ingrediente
          </button>
        </div>

        <div class="footer">
          <button mat-flat-button color="primary" (click)="save()">
            Guardar cambios
          </button>
        </div>
      </div>

      <p *ngIf="!recipe">Cargando receta...</p>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        width: 100%;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .full {
        width: 100%;
        margin-bottom: 10px;
      }
      .table-container {
        overflow-x: auto;
        margin-bottom: 1rem;
      }
      table {
        width: 100%;
        min-width: 600px;
      }
      .actions {
        margin-bottom: 20px;
      }
      .footer {
        text-align: right;
      }
    `,
  ],
})
export class RecetaDetalleComponent implements OnInit {
  recipe: any = { ingredients: [] };
  cols = ['name', 'mode', 'value', 'actions'];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recipe = await this.api.get(`/recipes/${id}`);
      if (!this.recipe.ingredients) this.recipe.ingredients = [];
    }
  }

  addIngredient() {
    const newIng = { name: '', mode: 'BREAD_PCT', value: 0 };
    this.recipe.ingredients = [...this.recipe.ingredients, newIng];
  }

  removeIngredient(index: number) {
    this.recipe.ingredients = this.recipe.ingredients.filter(
      (_: any, i: number) => i !== index
    );
    this.recipe = { ...this.recipe };
  }

  async save() {
    try {
      // 🔹 Convertir nombres a mayúsculas
      this.recipe.ingredients = this.recipe.ingredients.map((i: any) => ({
        ...i,
        name: i.name.trim().toUpperCase(),
      }));

      await this.api.put(`/recipes/${this.recipe.id}`, this.recipe);
      alert('Receta actualizada correctamente');
      this.router.navigate(['/recetas']);
    } catch (err) {
      alert('Error al guardar los cambios');
      console.error(err);
    }
  }

  back() {
    this.router.navigate(['/recetas']);
  }
}
