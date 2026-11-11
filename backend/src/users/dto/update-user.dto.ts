import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ContractType, UserRole, UserTheme } from '../user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['admin', 'employee', 'kiosk'])
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(['light', 'dark'])
  theme?: UserTheme;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  weeklyHours?: number;

  // null clears the value.
  @IsOptional()
  @IsIn(['full_time', 'part_time'])
  contractType?: ContractType | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nif?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  naf?: string | null;
}
