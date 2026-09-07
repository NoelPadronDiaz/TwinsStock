import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Consumable } from '../consumables/consumable.entity';

@Entity('consumption_logs')
export class ConsumptionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Consumable, (consumable) => consumable.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'consumable_id' })
  consumable: Consumable;

  @Column({ name: 'consumable_id' })
  consumableId: string;

  @Index()
  @Column({ name: 'consumed_at', type: 'timestamptz' })
  consumedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
