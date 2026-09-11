import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ConsumablesService } from '../consumables/consumables.service';
import { ConsumptionLog } from './consumption-log.entity';
import { CreateConsumptionLogDto } from './dto/create-consumption-log.dto';

export interface FindLogsQuery {
  from?: string;
  to?: string;
  consumableId?: string;
  limit?: number;
}

@Injectable()
export class ConsumptionLogsService {
  constructor(
    @InjectRepository(ConsumptionLog)
    private readonly logsRepository: Repository<ConsumptionLog>,
    private readonly consumablesService: ConsumablesService,
  ) {}

  async create(dto: CreateConsumptionLogDto) {
    const log = this.logsRepository.create({
      consumableId: dto.consumableId,
      consumedAt: dto.consumedAt ? new Date(dto.consumedAt) : new Date(),
    });
    const saved = await this.logsRepository.save(log);
    await this.consumablesService.adjustStock(dto.consumableId, -1);
    return saved;
  }

  findAll(query: FindLogsQuery) {
    const where: Record<string, unknown> = {};

    if (query.consumableId) {
      where.consumableId = query.consumableId;
    }

    if (query.from && query.to) {
      where.consumedAt = Between(new Date(query.from), new Date(query.to));
    }

    return this.logsRepository.find({
      where,
      relations: { consumable: { category: true } },
      order: { consumedAt: 'DESC' },
      take: query.limit ?? 50,
    });
  }

  async remove(id: string) {
    const log = await this.logsRepository.findOneOrFail({ where: { id } });
    await this.logsRepository.delete({ id });
    await this.consumablesService.adjustStock(log.consumableId, 1);
  }
}
