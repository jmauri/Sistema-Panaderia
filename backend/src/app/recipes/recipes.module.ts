import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { Recipe } from './recipe.entity';
import { Ingredient } from './ingredient.entity';
import { Supply } from '../supplies/supply.entity';
import { SuppliesModule } from '../supplies/supplies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, Ingredient, Supply]),
    SuppliesModule,
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
