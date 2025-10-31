// backend/src/app/recipes/recipes.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './recipe.entity';
import { Ingredient } from './ingredient.entity';
import { Supply } from '../supplies/supply.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe) private repo: Repository<Recipe>,
    @InjectRepository(Ingredient) private ingRepo: Repository<Ingredient>,
    @InjectRepository(Supply) private supplyRepo: Repository<Supply>, // inyectamos repo de Supply
  ) {}

  // Crear una nueva receta (normaliza modos y crea insumos faltantes)
  async create(data: Partial<Recipe>) {
    const recipe = this.repo.create({
      name: (data.name ?? '').trim(),
      description: data.description ?? undefined,
    } as Partial<Recipe>);

    if (data.ingredients && Array.isArray(data.ingredients)) {
      const ingredients = data.ingredients.map((i) => {
        // Normalizar mode entrante (acepta varias variantes desde frontend)
        const rawMode = (i.mode || '').toString().trim().toLowerCase();
        let mode: 'percent' | 'unit' | 'fixed' = 'percent';

        if (rawMode === 'unit' || rawMode === 'unidad' || rawMode === 'u') mode = 'unit';
        else if (rawMode === 'fixed' || rawMode === 'fijo' || rawMode === 'fixed_amount') mode = 'fixed';
        else mode = 'percent';

        // Si frontend guardó el % en "value", usarlo como bakerPct
        const providedValue = Number(i.value ?? i.bakerPct ?? 0);

        const bakerPct = mode === 'percent' ? (i.bakerPct ?? (rawMode.includes('bread') || rawMode.includes('pct') ? providedValue : 0)) : 0;
        const value = mode !== 'percent' ? (i.value ?? i.bakerPct ?? 0) : (i.value ?? 0);

        return this.ingRepo.create({
          name: (i.name || '').trim().toUpperCase(),
          bakerPct: Number(bakerPct) || 0,
          type: i.type ?? 'OTHER',
          unit: i.unit ?? 'kg',
          mode,
          value: Number(value) || 0,
          recipe: recipe,
        } as Partial<Ingredient>);
      });

      recipe.ingredients = await this.ingRepo.save(ingredients);

      //Crear insumos faltantes en la tabla supplies con quantity = 0
      for (const ing of recipe.ingredients) {
        const name = (ing.name || '').trim().toUpperCase();
        // No crear insumo para AGUA (ingrediente técnico)
        if (name === 'AGUA') continue;

        let supply = await this.supplyRepo.findOne({ where: { name } });
        if (!supply) {
          supply = this.supplyRepo.create({
            name,
            quantity: 0,
            unit: ing.unit ?? 'kg',
            type: ing.type ?? 'OTHER',
            nonInventariable: false,
            isActive: true,
          } as Partial<Supply>);
          await this.supplyRepo.save(supply);
        } else {
          // opcional: sincronizar unidad si difiere (no forzar cambios que rompan inventario)
          if (!supply.unit && ing.unit) {
            supply.unit = ing.unit;
            await this.supplyRepo.save(supply);
          }
        }
      }
    }

    return this.repo.save(recipe);
  }

  // Obtener todas las recetas
  async findAll() {
    return this.repo.find({ relations: ['ingredients'] });
  }

  //Buscar una receta por ID
  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['ingredients'] });
  }

  // Actualizar una receta (reemplaza ingredientes si vienen)
  async update(id: number, data: Partial<Recipe>) {
    const recipe = await this.repo.findOne({ where: { id }, relations: ['ingredients'] });
    if (!recipe) throw new Error('Receta no encontrada');

    recipe.name = (data.name ?? recipe.name).trim();
    recipe.description = data.description ?? recipe.description;

    if (data.ingredients && Array.isArray(data.ingredients)) {
      // borramos ingredientes antiguos relacionados a esta receta
      await this.ingRepo.delete({ recipe: { id } });

      const newIngredients = data.ingredients.map((i) => {
        const rawMode = (i.mode || '').toString().trim().toLowerCase();
        let mode: 'percent' | 'unit' | 'fixed' = 'percent';
        if (rawMode === 'unit' || rawMode === 'unidad' || rawMode === 'u') mode = 'unit';
        else if (rawMode === 'fixed' || rawMode === 'fijo' || rawMode === 'fixed_amount') mode = 'fixed';
        else mode = 'percent';

        const providedValue = Number(i.value ?? i.bakerPct ?? 0);
        const bakerPct = mode === 'percent' ? (i.bakerPct ?? (rawMode.includes('bread') || rawMode.includes('pct') ? providedValue : 0)) : 0;
        const value = mode !== 'percent' ? (i.value ?? i.bakerPct ?? 0) : (i.value ?? 0);

        return this.ingRepo.create({
          name: (i.name || '').trim().toUpperCase(),
          bakerPct: Number(bakerPct) || 0,
          type: i.type ?? 'OTHER',
          unit: i.unit ?? 'kg',
          mode,
          value: Number(value) || 0,
          recipe: recipe,
        } as Partial<Ingredient>);
      });

      recipe.ingredients = await this.ingRepo.save(newIngredients);

      // Crear insumos faltantes (igual que en create)
      for (const ing of recipe.ingredients) {
        const name = (ing.name || '').trim().toUpperCase();
        if (name === 'AGUA') continue;
        let supply = await this.supplyRepo.findOne({ where: { name } });
        if (!supply) {
          supply = this.supplyRepo.create({
            name,
            quantity: 0,
            unit: ing.unit ?? 'kg',
            type: ing.type ?? 'OTHER',
            nonInventariable: false,
            isActive: true,
          } as Partial<Supply>);
          await this.supplyRepo.save(supply);
        } else {
          if (!supply.unit && ing.unit) {
            supply.unit = ing.unit;
            await this.supplyRepo.save(supply);
          }
        }
      }
    }

    return this.repo.save(recipe);
  }

  // Eliminar receta
  delete(id: number) {
    return this.repo.delete(id);
  }
}
