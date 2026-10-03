import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Market } from '../market.enum';

export class UpdateConsumableDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  minStock?: number;

  @IsOptional()
  @IsEnum(Market)
  market?: Market | null;
}
