import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { Recipe } from './recipe.entity';
import { Ingredient } from './ingredient.entity';
import { Supply } from '../supplies/supply.entity'; // 👈 importa Supply
import { SuppliesModule } from '../supplies/supplies.module'; // 👈 importa el módulo de insumos

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, Ingredient, Supply]), // 👈 agrega Supply aquí
    SuppliesModule, // 👈 importa el módulo completo por si usa su servicio
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
