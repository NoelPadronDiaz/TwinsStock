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
import { WeekTemplate } from './week-template.entity';

// One time range of a WeekTemplate. weekday: 0 = Monday ... 6 = Sunday
// (ISO-style, matches Postgres date_trunc('week', ...)).
@Entity('shift_templates')
@Index(['weekTemplateId', 'weekday'])
export class ShiftTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  // Nullable only so synchronize can add it to existing rows; the startup
  // backfill in WeekTemplatesService fills it, and new rows always set it.
  @ManyToOne(() => WeekTemplate, (template) => template.rows, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'week_template_id' })
  weekTemplate: WeekTemplate | null;

  @Column({ name: 'week_template_id', type: 'uuid', nullable: true })
  weekTemplateId: string | null;

  // Legacy 'morning' | 'afternoon' from the two-fixed-templates era. Kept in
  // the entity (removing it would make synchronize drop the column before the
  // backfill can read it to name the migrated templates). Not used otherwise.
  @Column({ type: 'varchar', default: 'morning' })
  period: string;

  @Column({ type: 'int' })
  weekday: number;

  @Column({ name: 'start_time', type: 'time', transformer: timeColumnTransformer })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', transformer: timeColumnTransformer })
  endTime: string;
}
