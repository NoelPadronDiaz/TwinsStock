import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consumable } from '../consumables/consumable.entity';
import { Market } from '../consumables/market.enum';
import { ShoppingListItem } from './shopping-list-item.entity';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingListItem)
    private readonly itemsRepository: Repository<ShoppingListItem>,
  ) {}

  findAll() {
    return this.itemsRepository.find({
      relations: { consumable: { category: true } },
      order: { createdAt: 'ASC' },
    });
  }

  async add(consumableId: string, market: Market | null) {
    const existing = await this.itemsRepository.findOne({ where: { consumableId } });
    if (existing) return existing;
    return this.itemsRepository.save(this.itemsRepository.create({ consumableId, market }));
  }

  async setMarket(consumableId: string, market: Market | null) {
    await this.itemsRepository.update({ consumableId }, { market });
    return this.itemsRepository.findOneOrFail({
      where: { consumableId },
      relations: { consumable: { category: true } },
    });
  }

  async remove(consumableId: string) {
    await this.itemsRepository.delete({ consumableId });
  }

  async syncAfterStockChange(consumable: Consumable) {
    if (!consumable.active) return;
    if (consumable.stock < consumable.minStock) {
      await this.add(consumable.id, consumable.market);
    }
  }
}
