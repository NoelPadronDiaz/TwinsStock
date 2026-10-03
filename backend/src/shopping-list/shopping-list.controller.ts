import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AddToShoppingListDto, UpdateShoppingItemDto } from './dto/shopping-list.dto';
import { ShoppingListService } from './shopping-list.service';

@Controller('shopping-list')
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  @Get()
  findAll() {
    return this.shoppingListService.findAll();
  }

  @Get('purchases')
  findPurchases(@Query('limit') limit?: string) {
    return this.shoppingListService.findPurchases(limit ? Number(limit) : undefined);
  }

  @Post()
  add(@Body() dto: AddToShoppingListDto) {
    return this.shoppingListService.add(dto.consumableId, dto.market ?? null);
  }

  @Post(':consumableId/purchase')
  markPurchased(@Param('consumableId') consumableId: string) {
    return this.shoppingListService.markPurchased(consumableId);
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
