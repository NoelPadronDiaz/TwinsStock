import { IsIn } from 'class-validator';
import { UserTheme } from '../user.entity';

export class UpdateThemeDto {
  @IsIn(['light', 'dark'])
  theme: UserTheme;
}
