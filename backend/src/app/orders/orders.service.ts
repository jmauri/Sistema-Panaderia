import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { Recipe } from '../recipes/recipe.entity';
import { SuppliesService } from '../supplies/supplies.service';
import { Supply } from '../supplies/supply.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private repo: Repository<Order>,
    @InjectRepository(Recipe) private recipeRepo: Repository<Recipe>,
    @InjectRepository(Supply) private supplyRepo: Repository<Supply>,
    private suppliesService: SuppliesService,
  ) {}

  findAll() {
    return this.repo.find({ relations: ['recipe', 'recipe.ingredients'] });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['recipe', 'recipe.ingredients'] });
  }

  // función auxiliar para limpiar y convertir números
  private parseNumber(value: any): number {
    if (value == null) return 0;
    let str = value.toString().trim().toLowerCase();
    // reemplazar comas por puntos y quitar % o texto no numérico
    str = str.replace(',', '.').replace(/[^0-9.\-]+/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  async create(data: any) {
    console.log('Datos recibidos en /orders:', data);
    const recipe = await this.recipeRepo.findOne({
      where: { id: data.recipeId },
      relations: ['ingredients'],
    });
    if (!recipe) throw new Error('Receta no encontrada');

    // peso unitario a kg
    const str = (data.unitWeight || '').toString().trim().toLowerCase();
    const pesoUnitarioKg =
      str.endsWith('kg')
        ? parseFloat(str.replace('kg', '').trim())
        : str.endsWith('g')
        ? parseFloat(str.replace('g', '').trim()) / 1000
        : parseFloat(str) / 1000;

    if (isNaN(pesoUnitarioKg) || pesoUnitarioKg <= 0)
      throw new Error('Peso unitario inválido');

    const totalWeightKg = pesoUnitarioKg * data.quantity;

    // hallar base de harina
    const harinaByName = recipe.ingredients.find(i =>
      (i.name || '').toUpperCase().includes('HARINA'),
    );
    const harinaByMaxPct = recipe.ingredients.reduce(
      (max, i) =>
        (this.parseNumber(i.bakerPct ?? 0) > this.parseNumber(max.bakerPct ?? 0) ? i : max),
      recipe.ingredients[0],
    );
    const harinaBase = harinaByName || harinaByMaxPct;

    const harinaPct = this.parseNumber(
      harinaBase?.bakerPct ?? harinaBase?.value ?? 100,
    );
    const baseKg = harinaBase ? (harinaPct / 100) * totalWeightKg : totalWeightKg;
    console.log('Ingredientes de receta recibida:', recipe.ingredients);

    // calcular ingredientes usados
    const ingredientsUsed = recipe.ingredients.map(ing => {
      const mode = (ing.mode || '').toString().toLowerCase();
      const pct = this.parseNumber(ing.bakerPct ?? ing.value ?? 0);
      const value = this.parseNumber(ing.value ?? 0);

      let cantidadKg = 0;

      if (
        mode === 'percent' ||
        mode === 'baker_pct' ||
        mode === 'bread_pct' ||
        mode.includes('pct') ||
        mode.includes('bread')
      ) {
        cantidadKg = (pct / 100) * baseKg;
      } else if (mode === 'unit') {
        cantidadKg = value * data.quantity;
      } else if (mode === 'fixed') {
        cantidadKg = value;
      } else {
        cantidadKg = (pct / 100) * baseKg;
      }

      if (!isFinite(cantidadKg) || cantidadKg < 0) {
        console.warn(`Ingrediente inválido: ${ing.name}`, ing);
        cantidadKg = 0;
      }

      const rawUnit = (ing.unit || 'kg').toString().toLowerCase();
      let unitOut = rawUnit;
      let cantidadOut: number;

      if (rawUnit === 'g') {
        cantidadOut = parseFloat((cantidadKg * 1000).toFixed(2));
        unitOut = 'g';
      } else if (rawUnit === 'ml') {
        cantidadOut = parseFloat((cantidadKg * 1000).toFixed(2));
        unitOut = 'ml';
      } else if (rawUnit === 'unidad' || rawUnit === 'unit') {
        cantidadOut = parseFloat(cantidadKg.toFixed(3));
        unitOut = 'unidad';
      } else if (rawUnit === 'l' || (ing.type || '').toUpperCase() === 'LIQUID') {
        if (cantidadKg >= 1) {
          cantidadOut = parseFloat(cantidadKg.toFixed(3));
          unitOut = 'L';
        } else {
          cantidadOut = parseFloat((cantidadKg * 1000).toFixed(2));
          unitOut = 'ml';
        }
      } else {
        if (cantidadKg < 1) {
          cantidadOut = parseFloat((cantidadKg * 1000).toFixed(2));
          unitOut = 'g';
        } else {
          cantidadOut = parseFloat(cantidadKg.toFixed(3));
          unitOut = 'kg';
        }
      }

      return {
        name: (ing.name || 'INGREDIENTE').toString().trim().toUpperCase(),
        cantidad: cantidadOut,
        unit: unitOut,
        _raw: {
          bakerPct: ing.bakerPct ?? null,
          value: ing.value ?? null,
          mode: ing.mode ?? null,
        },
      };
    });

    // guardar orden
    const order = this.repo.create({
      date: new Date(),
      recipe,
      quantity: data.quantity,
      unitWeight: data.unitWeight,
      totalWeight: totalWeightKg,
      ingredientsUsed,
    });

    const saved = await this.repo.save(order);

    // descontar inventario
    for (const ing of ingredientsUsed) {
      const name = (ing.name || '').trim().toUpperCase();
      const supply = await this.supplyRepo.findOne({ where: { name } });

      if (!supply || supply.nonInventariable || name === 'AGUA') continue;

      const delta =
        ing.unit === 'g' || ing.unit === 'ml'
          ? -(ing.cantidad / 1000)
          : -ing.cantidad;
      await this.suppliesService.updateQuantity(name, delta);
    }

    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['recipe', 'recipe.ingredients'],
    });
  }

  async delete(id: number) {
    const order = await this.repo.findOne({ where: { id } });
    if (order?.ingredientsUsed?.length) {
      for (const ing of order.ingredientsUsed) {
        const delta =
          ing.unit === 'g' || ing.unit === 'ml'
            ? ing.cantidad / 1000
            : ing.cantidad;
        await this.suppliesService.updateQuantity(ing.name, delta);
      }
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
