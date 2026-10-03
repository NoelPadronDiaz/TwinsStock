import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { ConsumptionLog } from '../consumption-logs/consumption-log.entity';
import { Market } from './market.enum';

@Entity('consumables')
export class Consumable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: 0 })
  position: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'min_stock', type: 'int', default: 0 })
  minStock: number;

  @Column({ type: 'enum', enum: Market, nullable: true })
  market: Market | null;

  @ManyToOne(() => Category, (category) => category.consumables, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string | null;

  @OneToMany(() => ConsumptionLog, (log) => log.consumable)
  logs: ConsumptionLog[];
}
