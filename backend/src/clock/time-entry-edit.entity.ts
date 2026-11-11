import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { TimeEntry } from './time-entry.entity';

export type TimeEntryEditAction = 'create' | 'update' | 'delete';

// Append-only audit of admin corrections. time_entry_id becomes NULL when the
// entry is deleted, but user_id and the before/after values keep the record
// meaningful.
@Entity('time_entry_edits')
@Index(['timeEntryId'])
export class TimeEntryEdit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TimeEntry, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'time_entry_id' })
  timeEntry: TimeEntry | null;

  @Column({ name: 'time_entry_id', type: 'uuid', nullable: true })
  timeEntryId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'edited_by' })
  editedBy: User | null;

  @Column({ name: 'edited_by', type: 'uuid', nullable: true })
  editedById: string | null;

  @Column({ type: 'varchar' })
  action: TimeEntryEditAction;

  @Column({ type: 'varchar' })
  reason: string;

  @Column({ name: 'previous_clock_in', type: 'timestamptz', nullable: true })
  previousClockIn: Date | null;

  @Column({ name: 'previous_clock_out', type: 'timestamptz', nullable: true })
  previousClockOut: Date | null;

  @Column({ name: 'new_clock_in', type: 'timestamptz', nullable: true })
  newClockIn: Date | null;

  @Column({ name: 'new_clock_out', type: 'timestamptz', nullable: true })
  newClockOut: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
