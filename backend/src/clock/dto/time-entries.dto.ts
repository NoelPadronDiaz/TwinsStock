import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class MonthQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

export class UserMonthQueryDto extends MonthQueryDto {
  @IsUUID()
  userId: string;
}

class ReasonDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Indica el motivo de la corrección.' })
  @MaxLength(300)
  reason: string;
}

// Times are local Atlantic/Canary wall-clock on `date`; no clockOut = still open.
export class UpdateTimeEntryDto extends ReasonDto {
  @Matches(DATE_RE, { message: 'date debe tener el formato YYYY-MM-DD.' })
  date: string;

  @Matches(TIME_RE, { message: 'clockIn debe tener el formato HH:MM.' })
  clockIn: string;

  @IsOptional()
  @Matches(TIME_RE, { message: 'clockOut debe tener el formato HH:MM.' })
  clockOut?: string | null;
}

export class CreateTimeEntryDto extends UpdateTimeEntryDto {
  @IsUUID()
  userId: string;
}

export class DeleteTimeEntryDto extends ReasonDto {}
