import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type UserRole = 'admin' | 'employee' | 'kiosk';
export type UserTheme = 'light' | 'dark';
export type ContractType = 'full_time' | 'part_time';

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

  @Column({ name: 'contract_type', type: 'varchar', nullable: true })
  contractType: ContractType | null;

  // Personal data: select: false so it's never loaded (and so never ends up
  // in a login response, localStorage or a joined relation) unless a query
  // asks for it explicitly — only the admin /users endpoints and the
  // printed timesheet do.
  @Column({ type: 'varchar', nullable: true, select: false })
  nif?: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  naf?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
