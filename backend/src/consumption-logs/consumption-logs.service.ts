import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
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
  ) {}

  create(dto: CreateConsumptionLogDto) {
    const log = this.logsRepository.create({
      consumableId: dto.consumableId,
      consumedAt: dto.consumedAt ? new Date(dto.consumedAt) : new Date(),
    });
    return this.logsRepository.save(log);
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
      relations: { consumable: true },
      order: { consumedAt: 'DESC' },
      take: query.limit ?? 50,
    });
  }

  remove(id: string) {
    return this.logsRepository.delete({ id });
  }
}
