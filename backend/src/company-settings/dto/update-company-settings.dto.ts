import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cif?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  ccc?: string | null;
}
