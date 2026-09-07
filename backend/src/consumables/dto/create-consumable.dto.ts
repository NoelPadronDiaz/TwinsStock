import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateConsumableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsUUID()
  categoryId: string;
}
