import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumptionLog } from '../consumption-logs/consumption-log.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumptionLog])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
