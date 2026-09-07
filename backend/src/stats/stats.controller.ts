import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { StatsGroupBy, StatsService } from './stats.service';

const VALID_GROUP_BY: StatsGroupBy[] = ['day', 'week', 'month'];

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.statsService.summary({ from, to });
  }

  @Get('timeseries')
  timeseries(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy: string = 'day',
  ) {
    if (!VALID_GROUP_BY.includes(groupBy as StatsGroupBy)) {
      throw new BadRequestException(`groupBy must be one of: ${VALID_GROUP_BY.join(', ')}`);
    }
    return this.statsService.timeseries({ from, to }, groupBy as StatsGroupBy);
  }
}
