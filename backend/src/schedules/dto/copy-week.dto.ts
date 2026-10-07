import { IsUUID, Matches } from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class CopyWeekDto {
  @IsUUID()
  userId: string;

  @Matches(DATE_RE, { message: 'sourceWeekStart debe tener el formato YYYY-MM-DD.' })
  sourceWeekStart: string;

  @Matches(DATE_RE, { message: 'targetWeekStart debe tener el formato YYYY-MM-DD.' })
  targetWeekStart: string;
}
