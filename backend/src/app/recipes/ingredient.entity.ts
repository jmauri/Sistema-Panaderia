import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('float', { default: 0 })
  bakerPct: number;

  @Column({ default: 'OTHER' })
  type: string;

  @Column({ default: 'percent' })
  mode: 'percent' | 'fixed' | 'unit';

  @Column('float',{ default: 0 })
  value: number;

  @Column({ default: 'kg' })
  unit: string;

  @ManyToOne(() => Recipe, (r) => r.ingredients)
  recipe: Recipe;

  @Column('float', { default: 0 })
  weight: number; // peso unitario en gramos


  @BeforeInsert()
  @BeforeUpdate()
  normalizeName() {
    if (this.name) {
      this.name = this.name.trim().toUpperCase();
    }
  }
}
