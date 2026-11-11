import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ShiftTemplate } from './shift-template.entity';

// A named weekly pattern for one employee (e.g. "Mañana", "Tarde"). Its
// per-weekday time ranges live in shift_templates.
@Entity('week_templates')
@Index(['userId', 'name'], { unique: true })
export class WeekTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar' })
  name: string;

  @OneToMany(() => ShiftTemplate, (row) => row.weekTemplate)
  rows: ShiftTemplate[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
