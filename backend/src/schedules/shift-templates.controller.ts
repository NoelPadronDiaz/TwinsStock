import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReplaceShiftTemplatesDto } from './dto/shift-template.dto';
import { ShiftTemplatesService } from './shift-templates.service';

@Controller('shift-templates')
@Roles('admin')
export class ShiftTemplatesController {
  constructor(private readonly shiftTemplatesService: ShiftTemplatesService) {}

  @Get(':userId')
  findForUser(@Param('userId') userId: string) {
    return this.shiftTemplatesService.findForUser(userId);
  }

  @Put(':userId')
  replaceAll(@Param('userId') userId: string, @Body() dto: ReplaceShiftTemplatesDto) {
    return this.shiftTemplatesService.replaceAll(userId, dto.templates);
  }
}
