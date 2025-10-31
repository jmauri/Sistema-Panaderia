import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule
  ],
  template: `
  <section class="container">
    <h2>Órdenes de Producción</h2>

    <mat-card class="form-card">
      <form (ngSubmit)="crearOrden()">
        <mat-form-field appearance="fill" class="half">
          <mat-label>Receta</mat-label>
          <mat-select [(ngModel)]="nueva.recipeId" name="recipeId" (selectionChange)="onRecipeChange()" required>
            <mat-option *ngFor="let r of recetas" [value]="r.id">{{ r.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="half">
          <mat-label>Cantidad (nº panes)</mat-label>
          <input matInput type="number" [(ngModel)]="nueva.quantity" name="quantity" (ngModelChange)="updatePreview()" required>
        </mat-form-field>

        <mat-form-field appearance="fill" class="half">
          <mat-label>Peso unitario (g o kg) — ej: 80, 80g, 0.08kg</mat-label>
          <input matInput [(ngModel)]="nueva.unitWeight" name="unitWeight" (ngModelChange)="updatePreview()" required>
        </mat-form-field>

        <button mat-flat-button color="primary" type="submit">Crear Orden</button>
        <button mat-stroked-button type="button" (click)="updatePreview()" style="margin-left:8px;">Actualizar Preview</button>
      </form>
    </mat-card>

    <mat-card *ngIf="previewRecipe" class="preview-card">
      <h3>Preview — {{ previewRecipe.name }}</h3>
      <p *ngIf="previewRecipe.description">{{ previewRecipe.description }}</p>
      <div *ngIf="previewIngredients?.length">
        <strong>Ingredientes necesarios (preview):</strong>
        <ul>
          <li *ngFor="let pi of previewIngredients">{{ pi.name }} → {{ pi.cantidad }} {{ pi.unit }}</li>
        </ul>
      </div>
      <p *ngIf="!previewIngredients?.length">No hay ingredientes en la receta seleccionada.</p>
    </mat-card>

    <div *ngIf="ordenes.length">
      <h3>Órdenes registradas</h3>
      <table mat-table [dataSource]="ordenes" class="mat-elevation-z1">

        <ng-container matColumnDef="fecha">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let o">{{ o.date | date:'short' }}</td>
        </ng-container>

        <ng-container matColumnDef="receta">
          <th mat-header-cell *matHeaderCellDef>Receta</th>
          <td mat-cell *matCellDef="let o">{{ o.recipe?.name || '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="descripcion">
          <th mat-header-cell *matHeaderCellDef>Descripción</th>
          <td mat-cell *matCellDef="let o">{{ o.recipe?.description || '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="cantidad">
          <th mat-header-cell *matHeaderCellDef>Cantidad</th>
          <td mat-cell *matCellDef="let o">{{ o.quantity }}</td>
        </ng-container>

        <ng-container matColumnDef="pesoPorUnidad">
          <th mat-header-cell *matHeaderCellDef>Peso por unidad</th>
          <td mat-cell *matCellDef="let o">{{ o.unitWeight }}</td>
        </ng-container>

        <ng-container matColumnDef="pesoTotal">
          <th mat-header-cell *matHeaderCellDef>Peso Total</th>
          <td mat-cell *matCellDef="let o">{{ o.totalWeight | number:'1.3-3' }} kg</td>
        </ng-container>

        <ng-container matColumnDef="ingredientes">
          <th mat-header-cell *matHeaderCellDef>Ingredientes usados</th>
          <td mat-cell *matCellDef="let o">
            <ul>
              <li *ngFor="let i of o.ingredientsUsed">{{ i.name | uppercase }} → {{ i.cantidad }} {{ i.unit || 'unidad' }}</li>
            </ul>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            <button mat-icon-button color="warn" (click)="eliminar(o.id)">🗑️</button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    </div>

    <p *ngIf="!ordenes.length">No hay órdenes registradas.</p>
  </section>
  `,
  styles: [`
    .container { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-card, .preview-card { padding: 1rem; }
    .half { width: 48%; }
    table { width: 100%; margin-top: 1rem; min-width: 800px; }
    @media (max-width: 768px) { .half { width: 100%; } table { font-size: 13px; } }
  `]
})
export class OrdersComponent implements OnInit {
  recetas: any[] = [];
  ordenes: any[] = [];
  nueva: any = { recipeId: null, quantity: 0, unitWeight: '' };
  cols = ['fecha', 'receta', 'descripcion', 'cantidad', 'pesoPorUnidad', 'pesoTotal', 'ingredientes', 'actions'];

  previewRecipe: any = null;
  previewIngredients: Array<{ name: string; cantidad: number; unit: string }> = [];

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.cargarRecetas();
    await this.cargarOrdenes();
  }

  async cargarRecetas() {
    try {
      this.recetas = await this.api.get('/recipes');
    } catch (err) {
      console.error('Error al cargar recetas:', err);
      this.recetas = [];
    }
  }

  async cargarOrdenes() {
    try {
      this.ordenes = await this.api.get('/orders');
      // normalizamos mayúsculas para visualización
      this.ordenes = this.ordenes.map(o => ({
        ...o,
        recipe: o.recipe ? { ...o.recipe, name: (o.recipe.name || '').toUpperCase() } : o.recipe,
        ingredientsUsed: (o.ingredientsUsed || []).map((ing: any) => ({
          ...ing,
          name: (ing.name || '').toUpperCase()
        }))
      }));
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
      this.ordenes = [];
    }
  }

  onRecipeChange() {
    const id = this.nueva.recipeId;
    this.previewRecipe = this.recetas.find(r => r.id == id) ?? null;
    this.updatePreview();
  }

  updatePreview() {
    if (!this.previewRecipe) {
      this.previewIngredients = [];
      return;
    }

    const recipe = JSON.parse(JSON.stringify(this.previewRecipe));
    const quantity = Number(this.nueva.quantity) || 0;
    const pesoUnitarioKg = this.parseUnitWeightToKg(this.nueva.unitWeight || '0');
    const totalWeightKg = pesoUnitarioKg * quantity;

    const harina = (recipe.ingredients || []).find((i: any) => (i.name || '').toLowerCase().includes('harina'))
      || (recipe.ingredients || [])[0];
    const harinaPct = Number(harina?.bakerPct ?? harina?.value ?? 100);
    const baseKg = harina ? (harinaPct / 100) * totalWeightKg : totalWeightKg;

    this.previewIngredients = (recipe.ingredients || []).map((i: any) => {
      const mode = (i.mode || '').toString().toLowerCase();
      const pct = Number(i.bakerPct ?? i.value ?? 0);
      const value = Number(i.value ?? 0);
      let cantidadKg = 0;
      const rawUnit = (i.unit || 'kg').toString().toLowerCase();

      if (mode === 'percent' || mode === 'baker_pct' || mode === 'bread_pct' || mode.includes('pct') || mode.includes('bread')) {
        cantidadKg = (pct / 100) * baseKg;
      } else if (mode === 'unit') {
        cantidadKg = value * quantity;
      } else if (mode === 'fixed') {
        cantidadKg = value;
      } else {
        // fallback
        cantidadKg = (pct / 100) * baseKg;
      }

      // formateo y respeto de unidad original
      let cantidad: number;
      let unit = rawUnit;
      if (rawUnit === 'g') {
        cantidad = parseFloat((cantidadKg * 1000).toFixed(2));
        unit = 'g';
      } else if (rawUnit === 'ml') {
        cantidad = parseFloat((cantidadKg * 1000).toFixed(2));
        unit = 'ml';
      } else if (rawUnit === 'unidad' || rawUnit === 'unit') {
        cantidad = parseFloat((cantidadKg).toFixed(3));
        unit = 'unidad';
      } else if (rawUnit === 'l' || (i.type || '').toUpperCase() === 'LIQUID') {
        if (cantidadKg >= 1) {
          cantidad = parseFloat(cantidadKg.toFixed(3));
          unit = 'L';
        } else {
          cantidad = parseFloat((cantidadKg * 1000).toFixed(2));
          unit = 'ml';
        }
      } else {
        if (cantidadKg < 1) {
          cantidad = parseFloat((cantidadKg * 1000).toFixed(2));
          unit = 'g';
        } else {
          cantidad = parseFloat(cantidadKg.toFixed(3));
          unit = 'kg';
        }
      }

      return { name: (i.name || '').toUpperCase(), cantidad, unit };
    });
  }

  private parseUnitWeightToKg(input: string | number): number {
    let kg = 0;
    const s = input?.toString()?.trim().toLowerCase();
    if (!s) return 0;
    if (s.endsWith('kg')) kg = parseFloat(s.replace('kg', '').trim());
    else if (s.endsWith('g')) kg = parseFloat(s.replace('g', '').trim()) / 1000;
    else kg = parseFloat(s) / 1000;
    return isNaN(kg) ? 0 : kg;
  }

  async crearOrden() {
    try {
      if (!this.nueva.recipeId) return alert('Seleccione una receta');
      if (!this.nueva.quantity || this.nueva.quantity <= 0) return alert('Cantidad inválida');
      if (!this.nueva.unitWeight) return alert('Ingrese peso unitario');

      await this.api.post('/orders', this.nueva);
      alert('✅ Orden creada correctamente');
      this.nueva = { recipeId: null, quantity: 0, unitWeight: '' };
      this.previewRecipe = null;
      this.previewIngredients = [];
      await this.cargarOrdenes();
    } catch (err) {
      console.error(err);
      alert('❌ Error al crear la orden');
    }
  }

  async eliminar(id: number) {
    if (!confirm('¿Eliminar orden?')) return;
    try {
      await this.api.delete(`/orders/${id}`);
      await this.cargarOrdenes();
    } catch (err) {
      console.error(err);
      alert('❌ Error al eliminar la orden');
    }
  }
}
