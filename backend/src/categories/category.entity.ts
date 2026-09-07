import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Consumable } from '../consumables/consumable.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: 0 })
  position: number;

  @OneToMany(() => Consumable, (consumable) => consumable.category)
  consumables: Consumable[];
}
