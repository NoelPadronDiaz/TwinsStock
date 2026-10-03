import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Consumable } from '../consumables/consumable.entity';
import { Market } from '../consumables/market.enum';

@Entity('shopping_list_items')
export class ShoppingListItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Consumable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumable_id' })
  consumable: Consumable;

  @Column({ name: 'consumable_id', unique: true })
  consumableId: string;

  @Column({ type: 'enum', enum: Market, nullable: true })
  market: Market | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
