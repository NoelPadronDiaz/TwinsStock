import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AddToShoppingListDto, UpdateShoppingItemDto } from './dto/shopping-list.dto';
import { ShoppingListService } from './shopping-list.service';

@Controller('shopping-list')
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  @Get()
  findAll() {
    return this.shoppingListService.findAll();
  }

  @Post()
  add(@Body() dto: AddToShoppingListDto) {
    return this.shoppingListService.add(dto.consumableId, dto.market ?? null);
  }

  @Patch(':consumableId')
  update(@Param('consumableId') consumableId: string, @Body() dto: UpdateShoppingItemDto) {
    return this.shoppingListService.setMarket(consumableId, dto.market ?? null);
  }

  @Delete(':consumableId')
  remove(@Param('consumableId') consumableId: string) {
    return this.shoppingListService.remove(consumableId);
  }
}
