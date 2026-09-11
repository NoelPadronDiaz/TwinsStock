import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { Consumable } from './consumable.entity';

const DEFAULT_CATALOG: { category: string; products: string[] }[] = [
  {
    category: 'Líquidos y Cremas',
    products: [
      'Pistacho',
      'Cacahuete',
      'Cacao',
      'Dulce de Leche (tarrina)',
      'Dulce de Leche (fácil)',
      'Leche Condensada (lata)',
      'Leche Condensada (fácil)',
      'Crema de Maracuyá',
      'Nata',
      'Leche de Coco',
      'Leche Sin Lactosa',
      'Leche de Avena',
      'Agua',
    ],
  },
  {
    category: 'Productos secos',
    products: [
      'CornFlakes',
      'Granola',
      'Granola de Chocolate',
      'Galleta Salada',
      'Galleta María',
      'Leche en polvo',
      'Pepitas de chocolate negro',
      'Pepitas de chocolate blanco',
      'Pistacho Crunchi',
      'Coco Rallado',
      'Cacahuetes',
      'Proteina y semillas de chía',
    ],
  },
  {
    category: 'Congelados',
    products: ['Piña', 'Mango', "Açai 2'9l", 'Açai 280ml'],
  },
  {
    category: 'Consumibles',
    products: [
      'Paquete de vasos 375 con logo',
      'Paquete de vasos 500 con logo',
      'Paquete de vasos 500 sin logo',
      'Vasos grandes para llevar',
      'Tapas',
      'Cucharas',
      'Servilletas',
    ],
  },
];

@Injectable()
export class ConsumablesService implements OnModuleInit {
  constructor(
    @InjectRepository(Consumable)
    private readonly consumablesRepository: Repository<Consumable>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    const categories = await this.categoriesService.ensureSeeded();
    const categoryByName = new Map(categories.map((c) => [c.name, c]));

    const canonicalNames = new Set<string>();
    let position = 0;

    for (const { category, products } of DEFAULT_CATALOG) {
      const categoryEntity = categoryByName.get(category);
      for (const name of products) {
        canonicalNames.add(name);
        const existing = await this.consumablesRepository.findOne({ where: { name } });
        if (existing) {
          existing.categoryId = categoryEntity?.id ?? null;
          existing.position = position;
          existing.active = true;
          await this.consumablesRepository.save(existing);
        } else {
          await this.consumablesRepository.save(
            this.consumablesRepository.create({
              name,
              categoryId: categoryEntity?.id ?? null,
              position,
              active: true,
            }),
          );
        }
        position++;
      }
    }

    const all = await this.consumablesRepository.find();
    for (const consumable of all) {
      if (!canonicalNames.has(consumable.name) && consumable.active) {
        consumable.active = false;
        await this.consumablesRepository.save(consumable);
      }
    }
  }

  findAll(
    filters: {
      includeInactive?: boolean;
      active?: boolean;
      categoryId?: string;
      stockStatus?: 'in' | 'out';
    } = {},
  ) {
    const qb = this.consumablesRepository
      .createQueryBuilder('consumable')
      .leftJoinAndSelect('consumable.category', 'category')
      .orderBy('category.position', 'ASC')
      .addOrderBy('consumable.position', 'ASC');

    if (filters.active !== undefined) {
      qb.andWhere('consumable.active = :active', { active: filters.active });
    } else if (!filters.includeInactive) {
      qb.andWhere('consumable.active = :active', { active: true });
    }
    if (filters.categoryId) {
      qb.andWhere('consumable.categoryId = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters.stockStatus === 'in') {
      qb.andWhere('consumable.stock > 0');
    } else if (filters.stockStatus === 'out') {
      qb.andWhere('consumable.stock <= 0');
    }

    return qb.getMany();
  }

  findOne(id: string) {
    return this.consumablesRepository.findOneOrFail({
      where: { id },
      relations: { category: true },
    });
  }

  create(name: string, categoryId: string) {
    return this.consumablesRepository.save(
      this.consumablesRepository.create({ name, categoryId }),
    );
  }

  async update(id: string, dto: { name?: string; categoryId?: string; active?: boolean }) {
    await this.consumablesRepository.update({ id }, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.consumablesRepository.delete({ id });
  }

  async adjustStock(id: string, delta: number) {
    await this.consumablesRepository
      .createQueryBuilder()
      .update(Consumable)
      .set({ stock: () => 'GREATEST(stock + :delta, 0)' })
      .where('id = :id', { id })
      .setParameter('delta', delta)
      .execute();
    return this.findOne(id);
  }
}
