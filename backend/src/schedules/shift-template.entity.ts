import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { timeColumnTransformer } from '../common/time-column.transformer';
import { User } from '../users/user.entity';

// weekday: 0 = Monday ... 6 = Sunday (ISO-style, matches Postgres date_trunc('week', ...)).
@Entity('shift_templates')
@Index(['userId', 'weekday'])
export class ShiftTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'int' })
  weekday: number;

  @Column({ name: 'start_time', type: 'time', transformer: timeColumnTransformer })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', transformer: timeColumnTransformer })
  endTime: string;
}
