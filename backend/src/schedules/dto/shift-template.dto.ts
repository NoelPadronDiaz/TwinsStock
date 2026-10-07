import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, Matches, Max, Min, ValidateNested } from 'class-validator';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ShiftTemplateRowDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @Matches(TIME_RE, { message: 'startTime debe tener el formato HH:MM.' })
  startTime: string;

  @Matches(TIME_RE, { message: 'endTime debe tener el formato HH:MM.' })
  endTime: string;
}

export class ReplaceShiftTemplatesDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ShiftTemplateRowDto)
  templates: ShiftTemplateRowDto[];
}
