import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

// Partial unique index: a user can only ever have one OPEN entry at a time.
// Backstop for the "first punch" race (two concurrent scans with no prior
// row to lock) — ClockService catches the resulting unique violation.
@Entity('time_entries')
@Index(['userId'], { unique: true, where: 'clock_out IS NULL' })
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'clock_in', type: 'timestamptz' })
  clockIn: Date;

  @Column({ name: 'clock_out', type: 'timestamptz', nullable: true })
  clockOut: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
