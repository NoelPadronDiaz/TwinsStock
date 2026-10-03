import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Consumable } from '../consumables/consumable.entity';
import { Market } from '../consumables/market.enum';

@Entity('purchase_logs')
export class PurchaseLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Consumable, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'consumable_id' })
  consumable: Consumable | null;

  @Column({ name: 'consumable_id', nullable: true })
  consumableId: string | null;

  @Column({ name: 'consumable_name' })
  consumableName: string;

  @Column({ type: 'enum', enum: Market, nullable: true })
  market: Market | null;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn({ name: 'purchased_at', type: 'timestamptz' })
  purchasedAt: Date;
}
