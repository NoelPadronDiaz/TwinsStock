import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { UserRole } from '../user.entity';

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

  @IsIn(['admin', 'employee'])
  role: UserRole;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  weeklyHours?: number;
}
