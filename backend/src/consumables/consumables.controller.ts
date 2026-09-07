import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
    return this.consumablesService.create(dto.name);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConsumableDto) {
    return this.consumablesService.setActive(id, dto.active);
  }
}
