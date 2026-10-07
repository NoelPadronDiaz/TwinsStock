import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateShiftDto {
  @IsUUID()
  userId: string;

  @Matches(DATE_RE, { message: 'date debe tener el formato YYYY-MM-DD.' })
  date: string;

  @Matches(TIME_RE, { message: 'startTime debe tener el formato HH:MM.' })
  startTime: string;

  @Matches(TIME_RE, { message: 'endTime debe tener el formato HH:MM.' })
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
