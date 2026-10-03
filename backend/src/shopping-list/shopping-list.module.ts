import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingListItem } from './shopping-list-item.entity';
import { ShoppingListController } from './shopping-list.controller';
import { ShoppingListService } from './shopping-list.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingListItem])],
  controllers: [ShoppingListController],
  providers: [ShoppingListService],
  exports: [ShoppingListService],
})
export class ShoppingListModule {}
