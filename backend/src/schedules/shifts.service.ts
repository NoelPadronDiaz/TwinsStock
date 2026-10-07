import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BUSINESS_TIMEZONE } from '../common/business-time';
import { ApplyTemplateDto } from './dto/apply-template.dto';
import { CopyWeekDto } from './dto/copy-week.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { addDays, enumerateDates, isoWeekday } from './schedule-date.util';
import { ShiftTemplate } from './shift-template.entity';
import { Shift } from './shift.entity';

export interface ShiftRangeResult {
  datesCreated: string[];
  datesSkipped: string[];
}

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftsRepository: Repository<Shift>,
    @InjectRepository(ShiftTemplate)
    private readonly templatesRepository: Repository<ShiftTemplate>,
  ) {}

  private assertValidRange(startTime: string, endTime: string) {
    if (endTime <= startTime) {
      throw new ConflictException('La hora de fin debe ser posterior a la de inicio.');
    }
  }

  private async assertNoOverlap(
    manager: EntityManager,
    userId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ) {
    const qb = manager
      .getRepository(Shift)
      .createQueryBuilder('shift')
      .where('shift.user_id = :userId', { userId })
      .andWhere('shift.date = :date', { date })
      .andWhere('shift.start_time < :endTime', { endTime })
      .andWhere(':startTime < shift.end_time', { startTime });
    if (excludeId) {
      qb.andWhere('shift.id != :excludeId', { excludeId });
    }
    const overlap = await qb.getExists();
    if (overlap) {
      throw new ConflictException('Este tramo se solapa con otro turno ya existente para ese empleado y día.');
    }
  }

  findAll(filter: { userId?: string; from: string; to: string }) {
    const qb = this.shiftsRepository
      .createQueryBuilder('shift')
      .leftJoin('shift.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.username'])
      .where('shift.date BETWEEN :from AND :to', { from: filter.from, to: filter.to });
    if (filter.userId) {
      qb.andWhere('shift.user_id = :userId', { userId: filter.userId });
    }
    return qb.orderBy('shift.date', 'ASC').addOrderBy('shift.start_time', 'ASC').getMany();
  }

  findForUser(userId: string, from: string, to: string) {
    return this.shiftsRepository
      .createQueryBuilder('shift')
      .where('shift.user_id = :userId', { userId })
      .andWhere('shift.date BETWEEN :from AND :to', { from, to })
      .orderBy('shift.date', 'ASC')
      .addOrderBy('shift.start_time', 'ASC')
      .getMany();
  }

  async create(dto: CreateShiftDto) {
    this.assertValidRange(dto.startTime, dto.endTime);
    return this.shiftsRepository.manager.transaction(async (manager) => {
      await this.assertNoOverlap(manager, dto.userId, dto.date, dto.startTime, dto.endTime);
      return manager.save(manager.create(Shift, dto));
    });
  }

  async update(id: string, dto: UpdateShiftDto) {
    return this.shiftsRepository.manager.transaction(async (manager) => {
      const shift = await manager.findOne(Shift, { where: { id } });
      if (!shift) {
        throw new NotFoundException('Turno no encontrado.');
      }

      const startTime = dto.startTime ?? shift.startTime;
      const endTime = dto.endTime ?? shift.endTime;
      this.assertValidRange(startTime, endTime);
      await this.assertNoOverlap(manager, shift.userId, shift.date, startTime, endTime, shift.id);

      shift.startTime = startTime;
      shift.endTime = endTime;
      if (dto.note !== undefined) shift.note = dto.note;
      return manager.save(shift);
    });
  }

  async remove(id: string) {
    const result = await this.shiftsRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Turno no encontrado.');
    }
  }

  async applyTemplate(dto: ApplyTemplateDto): Promise<ShiftRangeResult> {
    const templates = await this.templatesRepository.find({ where: { userId: dto.userId } });
    const byWeekday = new Map<number, ShiftTemplate[]>();
    for (const template of templates) {
      const list = byWeekday.get(template.weekday) ?? [];
      list.push(template);
      byWeekday.set(template.weekday, list);
    }

    const datesCreated: string[] = [];
    const datesSkipped: string[] = [];

    await this.shiftsRepository.manager.transaction(async (manager) => {
      for (const date of enumerateDates(dto.from, dto.to)) {
        const dayTemplates = byWeekday.get(isoWeekday(date));
        if (!dayTemplates || dayTemplates.length === 0) continue;

        const existing = await manager.getRepository(Shift).count({ where: { userId: dto.userId, date } });
        if (existing > 0) {
          datesSkipped.push(date);
          continue;
        }

        for (const template of dayTemplates) {
          await manager.save(
            manager.create(Shift, {
              userId: dto.userId,
              date,
              startTime: template.startTime,
              endTime: template.endTime,
            }),
          );
        }
        datesCreated.push(date);
      }
    });

    return { datesCreated, datesSkipped };
  }

  async copyWeek(dto: CopyWeekDto): Promise<ShiftRangeResult> {
    const deltaDays = Math.round(
      (new Date(dto.targetWeekStart).getTime() - new Date(dto.sourceWeekStart).getTime()) / (24 * 60 * 60 * 1000),
    );
    const sourceDates = enumerateDates(dto.sourceWeekStart, addDays(dto.sourceWeekStart, 6));

    const datesCreated: string[] = [];
    const datesSkipped: string[] = [];

    await this.shiftsRepository.manager.transaction(async (manager) => {
      for (const sourceDate of sourceDates) {
        const sourceShifts = await manager
          .getRepository(Shift)
          .find({ where: { userId: dto.userId, date: sourceDate } });
        if (sourceShifts.length === 0) continue;

        const targetDate = addDays(sourceDate, deltaDays);
        const existing = await manager.getRepository(Shift).count({ where: { userId: dto.userId, date: targetDate } });
        if (existing > 0) {
          datesSkipped.push(targetDate);
          continue;
        }

        for (const shift of sourceShifts) {
          await manager.save(
            manager.create(Shift, {
              userId: dto.userId,
              date: targetDate,
              startTime: shift.startTime,
              endTime: shift.endTime,
              note: shift.note,
            }),
          );
        }
        datesCreated.push(targetDate);
      }
    });

    return { datesCreated, datesSkipped };
  }

  async sumPlannedMinutes(userId: string, periodStart: Date, periodEnd: Date): Promise<number> {
    const raw = await this.shiftsRepository
      .createQueryBuilder('s')
      .select(
        `COALESCE(SUM(GREATEST(EXTRACT(EPOCH FROM (
           LEAST((s.date + s.end_time) AT TIME ZONE :tz, :periodEnd::timestamptz)
           - GREATEST((s.date + s.start_time) AT TIME ZONE :tz, :periodStart::timestamptz)
         )) / 60, 0)), 0)`,
        'plannedMinutes',
      )
      .where('s.user_id = :userId', { userId })
      .andWhere('(s.date + s.end_time) AT TIME ZONE :tz > :periodStart')
      .andWhere('(s.date + s.start_time) AT TIME ZONE :tz < :periodEnd')
      .setParameters({ userId, periodStart, periodEnd, tz: BUSINESS_TIMEZONE })
      .getRawOne<{ plannedMinutes: string }>();
    return Number(raw?.plannedMinutes ?? 0);
  }
}
