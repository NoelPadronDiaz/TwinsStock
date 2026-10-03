import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Market } from '../../consumables/market.enum';

export class AddToShoppingListDto {
  @IsUUID()
  consumableId: string;

  @IsOptional()
  @IsEnum(Market)
  market?: Market | null;
}

export class UpdateShoppingItemDto {
  @IsOptional()
  @IsEnum(Market)
  market?: Market | null;
}
