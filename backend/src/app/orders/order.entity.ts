import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Recipe } from '../recipes/recipe.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @ManyToOne(() => Recipe, (recipe) => recipe.id, { eager: true })
  recipe: Recipe;

  @Column('int')
  quantity: number;

  @Column('varchar')
  unitWeight: string;

  @Column('float')
  totalWeight: number;

  @Column('jsonb', { default: [] })
  ingredientsUsed: { name: string; cantidad: number; unit: string }[];
}
