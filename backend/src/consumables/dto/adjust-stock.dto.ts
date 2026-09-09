import { IsInt, Max, Min } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @Min(-1000)
  @Max(1000)
  delta: number;
}
