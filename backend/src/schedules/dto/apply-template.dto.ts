import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsUUID, Matches, ValidateNested } from 'class-validator';
import { ShiftPeriod, SHIFT_PERIODS } from '../shift-period';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class TemplateAssignmentDto {
  @Matches(DATE_RE, { message: 'from debe tener el formato YYYY-MM-DD.' })
  from: string;

  @Matches(DATE_RE, { message: 'to debe tener el formato YYYY-MM-DD.' })
  to: string;

  @IsIn(SHIFT_PERIODS)
  period: ShiftPeriod;
}

export class ApplyTemplateDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => TemplateAssignmentDto)
  assignments: TemplateAssignmentDto[];
}
