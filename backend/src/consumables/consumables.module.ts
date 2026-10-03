import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { ShoppingListModule } from '../shopping-list/shopping-list.module';
import { Consumable } from './consumable.entity';
import { ConsumablesController } from './consumables.controller';
import { ConsumablesService } from './consumables.service';

@Module({
  imports: [TypeOrmModule.forFeature([Consumable]), CategoriesModule, ShoppingListModule],
  controllers: [ConsumablesController],
  providers: [ConsumablesService],
  exports: [ConsumablesService],
})
export class ConsumablesModule {}
