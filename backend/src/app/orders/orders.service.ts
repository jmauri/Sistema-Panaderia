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

  private parseLoose(value: any): number {
    // manejo rápido de primitives
    if (value == null) return 0;
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'boolean') return value ? 1 : 0;

    // si es un objeto que contiene campos relevantes, pruebo recursivamente
    if (typeof value === 'object') {
      // casos comunes: { value: '70' } o { bakerPct: '60%' }
      if ('bakerPct' in value) return this.parseLoose(value.bakerPct);
      if ('value' in value) return this.parseLoose(value.value);
      if ('qty' in value) return this.parseLoose(value.qty);
      // intente convertir el objeto a string
      try {
        value = JSON.stringify(value);
      } catch {
        return 0;
      }
    }

    // ahora tratar como string
    let s = String(value).trim().toLowerCase();

    // Reemplazar coma decimal por punto, eliminar espacios
    s = s.replace(/\s+/g, '').replace(',', '.');

    // Pero primero, si es algo tipo "60g" o "0.08kg" captar el número inicial:
    const matchNumber = s.match(/-?\d+(\.\d+)?/);
    if (!matchNumber) return 0;
    const numStr = matchNumber[0];
    const num = parseFloat(numStr);
    return isFinite(num) ? num : 0;
  }

  private parseUnitWeightToKg(raw: any): number {
    if (raw == null) return 0;

    const s = String(raw).trim().toLowerCase();

    if (s.includes('kg')) {
      const n = this.parseLoose(s);
      return n;
    } else if (s.includes('g')) {
      const n = this.parseLoose(s);
      return n / 1000;
    } else if (s.includes('l')) {
      const n = this.parseLoose(s);
      // asumimos densidad 1 (L ~ kg) para líquidos
      return n;
    } else if (s.includes('ml')) {
      const n = this.parseLoose(s);
      return n / 1000;
    } else {
      // solo un número sin unidad -> asumimos gramos (ej: "80" -> 80 g)
      const n = this.parseLoose(s);

      // Para mantener compatibilidad tratamos número puro como gramos
      return n / 1000;
    }
  }

  async create(data: any) {
    console.log('Datos recibidos en /orders:', data);

    const recipe = await this.recipeRepo.findOne({
      where: { id: data.recipeId },
      relations: ['ingredients'],
    });

    console.log('Receta encontrada:', recipe?.id ?? null);
    if (!recipe) throw new Error('Receta no encontrada');

    const pesoUnitarioKg = this.parseUnitWeightToKg(data.unitWeight);
    if (!isFinite(pesoUnitarioKg) || pesoUnitarioKg <= 0) {
      console.warn('Peso unitario inválido parseado:', data.unitWeight, '=>', pesoUnitarioKg);
      throw new Error('Peso unitario inválido');
    }

    const quantity = Number(data.quantity) || 0;
    const totalWeightKg = pesoUnitarioKg * quantity;
    console.log('pesoUnitarioKg:', pesoUnitarioKg, 'quantity:', quantity, 'totalWeightKg:', totalWeightKg);

    // hallar harina: por nombre o por mayor bakerPct/value
    const ingredientes = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    console.log('Ingredientes de receta recibida:', ingredientes);

    const harinaByName = ingredientes.find(i => ('' + (i.name || '')).toUpperCase().includes('HARINA'));
    const harinaByMaxPct = ingredientes.reduce((max, i) => {
      const currentPct = this.parseLoose(i.bakerPct ?? i.value ?? 0);
      const maxPct = this.parseLoose(max?.bakerPct ?? max?.value ?? 0);
      return currentPct > maxPct ? i : max;
    }, ingredientes[0] || null);

    const harinaBase = harinaByName || harinaByMaxPct || null;
    let harinaPct = this.parseLoose(harinaBase?.bakerPct);
    if (!harinaPct || harinaPct <= 0) harinaPct = this.parseLoose(harinaBase?.value ?? 100);
    const baseKg = harinaBase ? (harinaPct / 100) * totalWeightKg : totalWeightKg;

    console.log('harinaBase:', harinaBase?.name ?? null, 'harinaPct:', harinaPct, 'baseKg:', baseKg);

    // calcular ingredientesUsed
    const ingredientsUsed = ingredientes.map((ing: any) => {
      const modeRaw = ing?.mode ?? '';
      const mode = String(modeRaw).toLowerCase();
      const pct = this.parseLoose(ing?.bakerPct ?? ing?.value ?? 0);
      const value = this.parseLoose(ing?.value ?? 0);

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
        cantidadKg = value * quantity;
      } else if (mode === 'fixed') {
        cantidadKg = value;
      } else {
        // fallback: usar pct si existe, sino usar value asumido en kg
        if (pct > 0) cantidadKg = (pct / 100) * baseKg;
        else cantidadKg = value;
      }

      if (!isFinite(cantidadKg) || cantidadKg < 0) {
        console.warn(`Ingrediente inválido detectado, forzando 0:`, ing);
        cantidadKg = 0;
      }

      const rawUnit = (ing?.unit || 'kg').toString().toLowerCase();
      let unitOut = rawUnit;
      let cantidadOut = 0;

      if (rawUnit === 'g') {
        cantidadOut = parseFloat((cantidadKg * 1000).toFixed(2));
        unitOut = 'g';
      } else if (rawUnit === 'ml') {
        cantidadOut = parseFloat((cantidadKg * 1000).toFixed(2));
        unitOut = 'ml';
      } else if (rawUnit === 'unidad' || rawUnit === 'unit') {
        cantidadOut = parseFloat(cantidadKg.toFixed(3));
        unitOut = 'unidad';
      } else if (rawUnit === 'l' || (ing?.type || '').toString().toUpperCase() === 'LIQUID') {
        if (cantidadKg >= 1) {
          cantidadOut = parseFloat(cantidadKg.toFixed(3));
          unitOut = 'L';
        } else {
          cantidadOut = parseFloat((cantidadKg * 1000).toFixed(2));
          unitOut = 'ml';
        }
      } else {
        // default kg display
        if (cantidadKg < 1) {
          cantidadOut = parseFloat((cantidadKg * 1000).toFixed(2));
          unitOut = 'g';
        } else {
          cantidadOut = parseFloat(cantidadKg.toFixed(3));
          unitOut = 'kg';
        }
      }

      // LOG por ingrediente (útil para debugging en Render)
      console.log(`Ing => ${ing?.name} | mode:${mode} | pct:${pct} | value:${value} | cantidadKg:${cantidadKg} | out:${cantidadOut}${unitOut}`);

      return {
        name: (ing?.name || 'INGREDIENTE').toString().trim().toUpperCase(),
        cantidad: cantidadOut,
        unit: unitOut,
        _raw: {
          bakerPct: ing?.bakerPct ?? null,
          value: ing?.value ?? null,
          mode: ing?.mode ?? null,
        },
      };
    });

    // crear la orden
    const order = this.repo.create({
      date: new Date(),
      recipe,
      quantity,
      unitWeight: data.unitWeight,
      totalWeight: totalWeightKg,
      ingredientsUsed,
    });

    const saved = await this.repo.save(order);

    // descontar inventario (respetando nonInventariable y AGUA)
    for (const ing of ingredientsUsed) {
      const name = (ing.name || '').trim().toUpperCase();
      const supply = await this.supplyRepo.findOne({ where: { name } });

      if (!supply || (supply as any).nonInventariable || name === 'AGUA') continue;

      const delta = ing.unit === 'g' || ing.unit === 'ml' ? -(ing.cantidad / 1000) : -ing.cantidad;
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
        const delta = ing.unit === 'g' || ing.unit === 'ml' ? ing.cantidad / 1000 : ing.cantidad;
        await this.suppliesService.updateQuantity(ing.name, delta);
      }
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
