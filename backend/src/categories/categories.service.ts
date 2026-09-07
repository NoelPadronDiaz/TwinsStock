import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

const DEFAULT_CATEGORIES = ['Líquidos y Cremas', 'Productos secos', 'Congelados', 'Consumibles'];

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async ensureSeeded(): Promise<Category[]> {
    for (let position = 0; position < DEFAULT_CATEGORIES.length; position++) {
      const name = DEFAULT_CATEGORIES[position];
      const exists = await this.categoriesRepository.findOne({ where: { name } });
      if (!exists) {
        await this.categoriesRepository.save(this.categoriesRepository.create({ name, position }));
      }
    }
    return this.findAll();
  }

  findAll() {
    return this.categoriesRepository.find({ order: { position: 'ASC' } });
  }
}
