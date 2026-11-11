import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class WeekTemplateRowDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @Matches(TIME_RE, { message: 'startTime debe tener el formato HH:MM.' })
  startTime: string;

  @Matches(TIME_RE, { message: 'endTime debe tener el formato HH:MM.' })
  endTime: string;
}

export class UpdateWeekTemplateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'La plantilla necesita un nombre.' })
  @MaxLength(60)
  name: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => WeekTemplateRowDto)
  rows: WeekTemplateRowDto[];
}

export class CreateWeekTemplateDto extends UpdateWeekTemplateDto {
  @IsUUID()
  userId: string;
}
