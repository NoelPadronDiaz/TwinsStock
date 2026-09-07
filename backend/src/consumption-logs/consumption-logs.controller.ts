import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ConsumptionLogsService } from './consumption-logs.service';
import { CreateConsumptionLogDto } from './dto/create-consumption-log.dto';

@Controller('consumption-logs')
export class ConsumptionLogsController {
  constructor(private readonly logsService: ConsumptionLogsService) {}

  @Post()
  create(@Body() dto: CreateConsumptionLogDto) {
    return this.logsService.create(dto);
  }

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('consumableId') consumableId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.logsService.findAll({
      from,
      to,
      consumableId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logsService.remove(id);
  }
}
