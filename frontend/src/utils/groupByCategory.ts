import { Consumable } from '../api/client';

export interface CategoryGroup {
  name: string;
  items: Consumable[];
}

export function groupByCategory(consumables: Consumable[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const consumable of consumables) {
    const key = consumable.categoryId ?? 'none';
    const name = consumable.category?.name ?? 'Otros';
    if (!groups.has(key)) {
      groups.set(key, { name, items: [] });
    }
    groups.get(key)!.items.push(consumable);
  }
  return [...groups.values()];
}
