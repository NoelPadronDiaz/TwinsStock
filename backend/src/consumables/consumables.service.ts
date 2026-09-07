import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consumable } from './consumable.entity';

const DEFAULT_CONSUMABLES = [
  'Granola',
  'Leche en polvo',
  'Crema de lotus',
  'Crema de pistacho',
  'Crema de cacahuete',
];

@Injectable()
export class ConsumablesService implements OnModuleInit {
  constructor(
    @InjectRepository(Consumable)
    private readonly consumablesRepository: Repository<Consumable>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    for (const name of DEFAULT_CONSUMABLES) {
      const exists = await this.consumablesRepository.findOne({ where: { name } });
      if (!exists) {
        await this.consumablesRepository.save(this.consumablesRepository.create({ name }));
      }
    }
  }

  findAll(includeInactive = false) {
    return this.consumablesRepository.find({
      where: includeInactive ? {} : { active: true },
      order: { name: 'ASC' },
    });
  }

  findOne(id: string) {
    return this.consumablesRepository.findOneOrFail({ where: { id } });
  }

  create(name: string) {
    return this.consumablesRepository.save(this.consumablesRepository.create({ name }));
  }

  async setActive(id: string, active: boolean) {
    await this.consumablesRepository.update({ id }, { active });
    return this.findOne(id);
  }
}
