import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumablesModule } from '../consumables/consumables.module';
import { ConsumptionLog } from './consumption-log.entity';
import { ConsumptionLogsController } from './consumption-logs.controller';
import { ConsumptionLogsService } from './consumption-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumptionLog]), ConsumablesModule],
  controllers: [ConsumptionLogsController],
  providers: [ConsumptionLogsService],
  exports: [ConsumptionLogsService],
})
export class ConsumptionLogsModule {}
