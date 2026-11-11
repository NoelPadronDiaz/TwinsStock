import { IsNotEmpty, IsString } from 'class-validator';

export class PunchDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
