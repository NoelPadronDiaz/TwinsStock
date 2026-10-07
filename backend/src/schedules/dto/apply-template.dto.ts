import { IsUUID, Matches } from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class ApplyTemplateDto {
  @IsUUID()
  userId: string;

  @Matches(DATE_RE, { message: 'from debe tener el formato YYYY-MM-DD.' })
  from: string;

  @Matches(DATE_RE, { message: 'to debe tener el formato YYYY-MM-DD.' })
  to: string;
}
