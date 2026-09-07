import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ConsumptionLog } from '../consumption-logs/consumption-log.entity';

@Entity('consumables')
export class Consumable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => ConsumptionLog, (log) => log.consumable)
  logs: ConsumptionLog[];
}
