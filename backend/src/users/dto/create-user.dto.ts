import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ContractType, UserRole } from '../user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['admin', 'employee', 'kiosk'])
  role: UserRole;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  weeklyHours?: number;

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
