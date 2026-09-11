import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ConsumablesService } from './consumables.service';
import { CreateConsumableDto } from './dto/create-consumable.dto';
import { UpdateConsumableDto } from './dto/update-consumable.dto';

@Controller('consumables')
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  @Get()
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('active') active?: string,
    @Query('categoryId') categoryId?: string,
    @Query('stockStatus') stockStatus?: 'in' | 'out',
  ) {
    return this.consumablesService.findAll({
      includeInactive: includeInactive === 'true',
      active: active === undefined ? undefined : active === 'true',
      categoryId,
      stockStatus,
    });
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateConsumableDto) {
    return this.consumablesService.create(dto.name, dto.categoryId);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateConsumableDto) {
    return this.consumablesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.consumablesService.remove(id);
  }

  @Patch(':id/stock')
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.consumablesService.adjustStock(id, dto.delta);
  }
}
