import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApplyTemplateDto } from './dto/apply-template.dto';
import { CopyWeekDto } from './dto/copy-week.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
@Roles('admin')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll(@Query('userId') userId: string | undefined, @Query('from') from: string, @Query('to') to: string) {
    return this.shiftsService.findAll({ userId, from, to });
  }

  @Get('me')
  @Roles('admin', 'employee')
  findMine(@Req() req: Request, @Query('from') from: string, @Query('to') to: string) {
    return this.shiftsService.findForUser(req.user!.sub, from, to);
  }

  @Post()
  create(@Body() dto: CreateShiftDto) {
    return this.shiftsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.shiftsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.shiftsService.remove(id);
  }

  @Post('apply-template')
  applyTemplate(@Body() dto: ApplyTemplateDto) {
    return this.shiftsService.applyTemplate(dto);
  }

  @Post('copy-week')
  copyWeek(@Body() dto: CopyWeekDto) {
    return this.shiftsService.copyWeek(dto);
  }
}
