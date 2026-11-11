import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Single row: company data printed on the Registro diario de jornada.
@Entity('company_settings')
export class CompanySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legal_name', type: 'varchar', nullable: true })
  legalName: string | null;

  @Column({ type: 'varchar', nullable: true })
  cif: string | null;

  @Column({ type: 'varchar', nullable: true })
  ccc: string | null;
}
