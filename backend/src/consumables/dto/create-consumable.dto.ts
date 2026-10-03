import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Market } from '../market.enum';

export class CreateConsumableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  minStock?: number;

  @IsOptional()
  @IsEnum(Market)
  market?: Market | null;
}
