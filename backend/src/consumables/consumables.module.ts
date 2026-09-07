import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consumable } from './consumable.entity';
import { ConsumablesController } from './consumables.controller';
import { ConsumablesService } from './consumables.service';

@Module({
  imports: [TypeOrmModule.forFeature([Consumable])],
  controllers: [ConsumablesController],
  providers: [ConsumablesService],
  exports: [ConsumablesService],
})
export class ConsumablesModule {}
