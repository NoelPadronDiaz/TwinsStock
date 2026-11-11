import { IsUUID, Matches } from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class ApplyWeekTemplateDto {
  @IsUUID()
  weekTemplateId: string;

  @Matches(DATE_RE, { message: 'weekStart debe tener el formato YYYY-MM-DD.' })
  weekStart: string;
}
