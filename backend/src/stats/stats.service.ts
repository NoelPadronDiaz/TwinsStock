import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumptionLog } from '../consumption-logs/consumption-log.entity';

export type StatsGroupBy = 'day' | 'week' | 'month';

export interface StatsRangeQuery {
  from?: string;
  to?: string;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(ConsumptionLog)
    private readonly logsRepository: Repository<ConsumptionLog>,
  ) {}

  private applyRange(qb: ReturnType<Repository<ConsumptionLog>['createQueryBuilder']>, range: StatsRangeQuery) {
    if (range.from) {
      qb.andWhere('log.consumed_at >= :from', { from: range.from });
    }
    if (range.to) {
      qb.andWhere('log.consumed_at <= :to', { to: range.to });
    }
    return qb;
  }

  async summary(range: StatsRangeQuery) {
    const qb = this.logsRepository
      .createQueryBuilder('log')
      .innerJoin('log.consumable', 'consumable')
      .select('consumable.id', 'consumableId')
      .addSelect('consumable.name', 'consumableName')
      .addSelect('COUNT(log.id)', 'count')
      .addSelect('MAX(log.consumed_at)', 'lastConsumedAt')
      .groupBy('consumable.id')
      .addGroupBy('consumable.name')
      .orderBy('count', 'DESC');

    this.applyRange(qb, range);

    const rows = await qb.getRawMany<{
      consumableId: string;
      consumableName: string;
      count: string;
      lastConsumedAt: Date | null;
    }>();

    return rows.map((row) => ({
      consumableId: row.consumableId,
      consumableName: row.consumableName,
      count: Number(row.count),
      lastConsumedAt: row.lastConsumedAt,
    }));
  }

  async timeseries(range: StatsRangeQuery, groupBy: StatsGroupBy = 'day') {
    const qb = this.logsRepository
      .createQueryBuilder('log')
      .innerJoin('log.consumable', 'consumable')
      .select(`date_trunc('${groupBy}', log.consumed_at)`, 'period')
      .addSelect('consumable.id', 'consumableId')
      .addSelect('consumable.name', 'consumableName')
      .addSelect('COUNT(log.id)', 'count')
      .groupBy('period')
      .addGroupBy('consumable.id')
      .addGroupBy('consumable.name')
      .orderBy('period', 'ASC');

    this.applyRange(qb, range);

    const rows = await qb.getRawMany<{
      period: Date;
      consumableId: string;
      consumableName: string;
      count: string;
    }>();

    return rows.map((row) => ({
      period: row.period,
      consumableId: row.consumableId,
      consumableName: row.consumableName,
      count: Number(row.count),
    }));
  }
}
