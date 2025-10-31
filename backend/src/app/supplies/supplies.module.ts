import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supply } from './supply.entity';
import { SuppliesService } from './supplies.service';
import { SuppliesController } from './supplies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Supply])],
  providers: [SuppliesService],
  controllers: [SuppliesController],
  exports: [SuppliesService],
})
export class SuppliesModule {}
