import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Supply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column('float', { default: 0 })
  quantity: number;

  @Column({ default: 'kg' })
  unit: string;

  @Column({ default: 'OTHER' })
  type: string;

  @Column({ default: false })
  nonInventariable: boolean;
}
