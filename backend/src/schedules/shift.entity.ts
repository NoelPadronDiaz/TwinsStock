import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateColumnTransformer } from '../common/date-column.transformer';
import { timeColumnTransformer } from '../common/time-column.transformer';
import { User } from '../users/user.entity';

@Entity('shifts')
@Index(['userId', 'date'])
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'date', transformer: dateColumnTransformer })
  date: string;

  @Column({ name: 'start_time', type: 'time', transformer: timeColumnTransformer })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', transformer: timeColumnTransformer })
  endTime: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
