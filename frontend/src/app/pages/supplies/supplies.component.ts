import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-supplies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <section class="container">
      <h2>Inventario de Insumos</h2>

      <mat-card class="form-card">
        <form (ngSubmit)="guardar()">
          <mat-form-field appearance="fill" class="half">
            <mat-label>Nombre</mat-label>
            <input matInput [(ngModel)]="nuevo.name" name="name" required />
          </mat-form-field>

          <mat-form-field appearance="fill" class="half">
            <mat-label>Tipo</mat-label>
            <mat-select [(ngModel)]="nuevo.type" name="type" required>
              <mat-option value="SOLID">Sólido</mat-option>
              <mat-option value="LIQUID">Líquido</mat-option>
              <mat-option value="UNIDAD">Unidad</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="fill" class="half">
            <mat-label>Cantidad</mat-label>
            <input
              matInput
              type="number"
              [(ngModel)]="nuevo.quantity"
              name="quantity"
              required
            />
          </mat-form-field>

          <mat-form-field appearance="fill" class="half">
            <mat-label>Unidad</mat-label>
            <mat-select [(ngModel)]="nuevo.unit" name="unit" required>
              <mat-option value="kg">Kg</mat-option>
              <mat-option value="g">g</mat-option>
              <mat-option value="L">L</mat-option>
              <mat-option value="unidad">Unidad</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit">
            Guardar
          </button>
        </form>
      </mat-card>

      <div class="table-container" *ngIf="insumos.length > 0">
        <table mat-table [dataSource]="insumos" class="mat-elevation-z1">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let s">{{ s.name }}</td>
          </ng-container>

          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Cantidad</th>
            <td mat-cell *matCellDef="let s">
              {{ s.quantity | number : '1.2-2' }} {{ s.unit }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let s">
              <button mat-icon-button color="warn" (click)="eliminar(s.id)">
                🗑️
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </div>

      <p *ngIf="insumos.length === 0">No hay insumos registrados.</p>
    </section>
  `,
  styles: [`
      .container {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .form-card {
        padding: 1rem;
      }
      form {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }
      .half {
        width: 48%;
      }
      .table-container {
        overflow-x: auto;
      }
      table {
        width: 100%;
        min-width: 600px;
      }
  `],
})
export class SuppliesComponent implements OnInit {
  insumos: any[] = [];
  nuevo = { name: '', type: '', quantity: 0, unit: '' };
  cols = ['name', 'quantity', 'actions'];

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.cargarInsumos();
  }

  async cargarInsumos() {
    try {
      const data = await this.api.get('/supplies');
      //Excluir "AGUA" sin importar mayúsculas/minúsculas
      this.insumos = data.filter((s: any) => s.name.toUpperCase() !== 'AGUA');
    } catch (err) {
      console.error('Error al cargar insumos:', err);
    }
  }

  async guardar() {
    try {
      //Normalizar nombre
      this.nuevo.name = this.nuevo.name.trim().toUpperCase();

      //Excluir AGUA
      if (this.nuevo.name === 'AGUA') {
        alert('⚠️ El agua no se registra como insumo de inventario.');
        return;
      }

      await this.api.post('/supplies', this.nuevo);
      await this.cargarInsumos();
      this.nuevo = { name: '', type: '', quantity: 0, unit: '' };
      alert('✅ Insumo guardado correctamente');
    } catch (err) {
      alert('❌ Error al guardar insumo');
      console.error(err);
    }
  }

  async eliminar(id: number) {
    if (!confirm('¿Eliminar insumo?')) return;
    try {
      await this.api.delete(`/supplies/${id}`);
      await this.cargarInsumos();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  }
}
