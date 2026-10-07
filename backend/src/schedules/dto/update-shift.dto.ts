import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateShiftDto {
  @IsOptional()
  @Matches(TIME_RE, { message: 'startTime debe tener el formato HH:MM.' })
  startTime?: string;

  @IsOptional()
  @Matches(TIME_RE, { message: 'endTime debe tener el formato HH:MM.' })
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
