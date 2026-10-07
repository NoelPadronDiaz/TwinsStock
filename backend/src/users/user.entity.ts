import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type UserRole = 'admin' | 'employee';
export type UserTheme = 'light' | 'dark';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  name: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', default: 'employee' })
  role: UserRole;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'varchar', default: 'light' })
  theme: UserTheme;

  // 'float' (not 'numeric') so pg returns a JS number, not a string.
  @Column({ name: 'weekly_hours', type: 'float', nullable: true })
  weeklyHours: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
