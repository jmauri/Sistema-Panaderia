import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Recipe } from '../recipes/recipe.entity';
import { SuppliesService } from '../supplies/supplies.service';
import { Supply } from '../supplies/supply.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Recipe, Supply])],
  controllers: [OrdersController],
  providers: [OrdersService, SuppliesService],
})
export class OrdersModule {}
