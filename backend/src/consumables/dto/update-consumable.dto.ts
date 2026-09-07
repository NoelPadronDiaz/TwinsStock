import { IsBoolean } from 'class-validator';

export class UpdateConsumableDto {
  @IsBoolean()
  active: boolean;
}
