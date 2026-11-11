import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateTimeEntryDto,
  DeleteTimeEntryDto,
  MonthQueryDto,
  UpdateTimeEntryDto,
  UserMonthQueryDto,
} from './dto/time-entries.dto';
import { TimeEntriesService } from './time-entries.service';

@Controller('time-entries')
@Roles('admin')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Get('month')
  month(@Query() query: UserMonthQueryDto) {
    return this.timeEntriesService.getMonth(query.userId, query.year, query.month);
  }

  @Get('month/me')
  @Roles('admin', 'employee')
  myMonth(@Req() req: Request, @Query() query: MonthQueryDto) {
    return this.timeEntriesService.getMonth(req.user!.sub, query.year, query.month);
  }

  @Get('sheet')
  sheet(@Query() query: UserMonthQueryDto) {
    return this.timeEntriesService.getSheet(query.userId, query.year, query.month);
  }

  @Get('sheet/me')
  @Roles('admin', 'employee')
  mySheet(@Req() req: Request, @Query() query: MonthQueryDto) {
    return this.timeEntriesService.getSheet(req.user!.sub, query.year, query.month);
  }

  @Get(':id/edits')
  edits(@Param('id', ParseUUIDPipe) id: string) {
    return this.timeEntriesService.listEdits(id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateTimeEntryDto) {
    return this.timeEntriesService.create(dto, req.user!.sub);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTimeEntryDto) {
    return this.timeEntriesService.update(id, dto, req.user!.sub);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DeleteTimeEntryDto) {
    await this.timeEntriesService.remove(id, dto.reason, req.user!.sub);
  }
}
