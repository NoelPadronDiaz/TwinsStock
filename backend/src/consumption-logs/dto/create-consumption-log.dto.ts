import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateConsumptionLogDto {
  @IsUUID()
  consumableId: string;

  @IsOptional()
  @IsDateString()
  consumedAt?: string;
}
