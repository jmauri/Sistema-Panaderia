import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private rs: RecipesService) {}

  @Get()
  all() { return this.rs.findAll(); }

  @Post()
  create(@Body() body: any) { return this.rs.create(body); }

  @Get(':id')
  one(@Param('id') id: string) { return this.rs.findOne(Number(id)); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.rs.update(Number(id), body); }

  @Delete(':id')
  delete(@Param('id') id: string) { return this.rs.delete(Number(id)); }
}
