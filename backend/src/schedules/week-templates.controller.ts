import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateWeekTemplateDto, UpdateWeekTemplateDto } from './dto/week-template.dto';
import { WeekTemplatesService } from './week-templates.service';

@Controller('week-templates')
@Roles('admin')
export class WeekTemplatesController {
  constructor(private readonly weekTemplatesService: WeekTemplatesService) {}

  @Get()
  findForUser(@Query('userId', ParseUUIDPipe) userId: string) {
    return this.weekTemplatesService.findForUser(userId);
  }

  @Post()
  create(@Body() dto: CreateWeekTemplateDto) {
    return this.weekTemplatesService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWeekTemplateDto) {
    return this.weekTemplatesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.weekTemplatesService.remove(id);
  }
}
