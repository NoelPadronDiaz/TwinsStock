import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumablesModule } from '../consumables/consumables.module';
import { ShoppingListModule } from '../shopping-list/shopping-list.module';
import { ConsumptionLog } from './consumption-log.entity';
import { ConsumptionLogsController } from './consumption-logs.controller';
import { ConsumptionLogsService } from './consumption-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumptionLog]), ConsumablesModule, ShoppingListModule],
  controllers: [ConsumptionLogsController],
  providers: [ConsumptionLogsService],
  exports: [ConsumptionLogsService],
})
export class ConsumptionLogsModule {}
