import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftTemplateRowDto } from './dto/shift-template.dto';
import { timeRangesOverlap } from './schedule-date.util';
import { ShiftTemplate } from './shift-template.entity';

@Injectable()
export class ShiftTemplatesService {
  constructor(
    @InjectRepository(ShiftTemplate)
    private readonly templatesRepository: Repository<ShiftTemplate>,
  ) {}

  findForUser(userId: string) {
    return this.templatesRepository.find({
      where: { userId },
      order: { weekday: 'ASC', startTime: 'ASC' },
    });
  }

  async replaceAll(userId: string, rows: ShiftTemplateRowDto[]) {
    this.validateBatch(rows);

    return this.templatesRepository.manager.transaction(async (manager) => {
      await manager.delete(ShiftTemplate, { userId });
      if (rows.length === 0) return [];
      const entities = rows.map((row) => manager.create(ShiftTemplate, { userId, ...row }));
      return manager.save(entities);
    });
  }

  private validateBatch(rows: ShiftTemplateRowDto[]) {
    for (const row of rows) {
      if (row.endTime <= row.startTime) {
        throw new ConflictException('La hora de fin debe ser posterior a la de inicio en la semana tipo.');
      }
    }

    const byWeekday = new Map<number, ShiftTemplateRowDto[]>();
    for (const row of rows) {
      const list = byWeekday.get(row.weekday) ?? [];
      list.push(row);
      byWeekday.set(row.weekday, list);
    }

    for (const list of byWeekday.values()) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (timeRangesOverlap(list[i].startTime, list[i].endTime, list[j].startTime, list[j].endTime)) {
            throw new ConflictException('Hay tramos solapados en la semana tipo.');
          }
        }
      }
    }
  }
}
