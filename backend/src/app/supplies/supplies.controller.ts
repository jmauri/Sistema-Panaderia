import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { SuppliesService } from './supplies.service';

@Controller('supplies')
export class SuppliesController {
  constructor(private service: SuppliesService) {}

  @Get()
  all() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.createOrUpdate(body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}
