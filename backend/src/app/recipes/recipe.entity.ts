import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column('float', { default: 100 })
  totalFlourPct: number;

  @Column('float', { nullable: true })
  prefermentPct: number;

  @OneToMany(() => Ingredient, (i) => i.recipe, { cascade: true })
  ingredients: Ingredient[];
}
