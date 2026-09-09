import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ConsumablesService } from './consumables.service';
import { CreateConsumableDto } from './dto/create-consumable.dto';
import { UpdateConsumableDto } from './dto/update-consumable.dto';

@Controller('consumables')
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.consumablesService.findAll(includeInactive === 'true');
  }

  @Post()
  create(@Body() dto: CreateConsumableDto) {
    return this.consumablesService.create(dto.name, dto.categoryId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConsumableDto) {
    return this.consumablesService.setActive(id, dto.active);
  }

  @Patch(':id/stock')
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.consumablesService.adjustStock(id, dto.delta);
  }
}
