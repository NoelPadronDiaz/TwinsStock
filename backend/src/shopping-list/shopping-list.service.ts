import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consumable } from '../consumables/consumable.entity';
import { Market } from '../consumables/market.enum';
import { PurchaseLog } from './purchase-log.entity';
import { ShoppingListItem } from './shopping-list-item.entity';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingListItem)
    private readonly itemsRepository: Repository<ShoppingListItem>,
    @InjectRepository(PurchaseLog)
    private readonly purchasesRepository: Repository<PurchaseLog>,
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

  async addUnit(consumable: Consumable) {
    await this.itemsRepository.query(
      `INSERT INTO shopping_list_items (consumable_id, market, quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (consumable_id)
       DO UPDATE SET quantity = shopping_list_items.quantity + 1`,
      [consumable.id, consumable.market],
    );
  }

  async removeUnit(consumableId: string) {
    await this.itemsRepository.query(
      `UPDATE shopping_list_items SET quantity = quantity - 1 WHERE consumable_id = $1`,
      [consumableId],
    );
    await this.itemsRepository.query(
      `DELETE FROM shopping_list_items WHERE consumable_id = $1 AND quantity <= 0`,
      [consumableId],
    );
  }

  markPurchased(consumableId: string) {
    return this.itemsRepository.manager.transaction(async (manager) => {
      const item = await manager.findOneOrFail(ShoppingListItem, {
        where: { consumableId },
        relations: { consumable: true },
      });
      const log = await manager.save(
        manager.create(PurchaseLog, {
          consumableId,
          consumableName: item.consumable.name,
          market: item.market,
          quantity: item.quantity,
        }),
      );
      await manager.delete(ShoppingListItem, { consumableId });
      return log;
    });
  }

  findPurchases(limit = 50) {
    return this.purchasesRepository.find({
      order: { purchasedAt: 'DESC' },
      take: limit,
    });
  }
}
