import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, In, Repository } from 'typeorm';
import {
  AFTERNOON_START_HOUR,
  BUSINESS_TIMEZONE,
  fromBusinessDateTime,
  toBusinessTime,
} from '../common/business-time';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { User } from '../users/user.entity';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/time-entries.dto';
import { TimeEntryEdit } from './time-entry-edit.entity';
import { TimeEntry } from './time-entry.entity';

const PENDING_AFTER_MS = 12 * 60 * 60 * 1000;
const POSTGRES_UNIQUE_VIOLATION = '23505';

export type Block = 'morning' | 'afternoon';

export interface MonthEntry {
  id: string;
  clockIn: Date;
  clockOut: Date | null;
  start: string; // HH:mm local
  end: string | null;
  block: Block;
  minutes: number | null;
  corrected: boolean;
  pendingCorrection: boolean;
}

export interface MonthDay {
  date: string;
  entries: MonthEntry[];
  totalMinutes: number;
  issues: string[];
}

function monthBounds(year: number, month: number) {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`, lastDay };
}

function blockOf(clockIn: Date): Block {
  return Number(toBusinessTime(clockIn).slice(0, 2)) < AFTERNOON_START_HOUR ? 'morning' : 'afternoon';
}

@Injectable()
export class TimeEntriesService implements OnModuleInit {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly entriesRepository: Repository<TimeEntry>,
    @InjectRepository(TimeEntryEdit)
    private readonly editsRepository: Repository<TimeEntryEdit>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly companySettingsService: CompanySettingsService,
  ) {}

  // Entries created before work_date existed. Idempotent.
  async onModuleInit() {
    await this.entriesRepository.query(
      `UPDATE time_entries SET work_date = (clock_in AT TIME ZONE $1)::date WHERE work_date IS NULL`,
      [BUSINESS_TIMEZONE],
    );
  }

  async getMonth(userId: string, year: number, month: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Empleado no encontrado.');
    }
    const { from, to } = monthBounds(year, month);
    const entries = await this.entriesRepository.find({
      where: { userId, workDate: Between(from, to) },
      order: { clockIn: 'ASC' },
    });

    const correctedIds = new Set<string>();
    if (entries.length > 0) {
      const edits = await this.editsRepository.find({
        select: { timeEntryId: true },
        where: { timeEntryId: In(entries.map((e) => e.id)) },
      });
      edits.forEach((edit) => edit.timeEntryId && correctedIds.add(edit.timeEntryId));
    }

    const now = Date.now();
    const byDate = new Map<string, MonthEntry[]>();
    for (const entry of entries) {
      const list = byDate.get(entry.workDate!) ?? [];
      list.push({
        id: entry.id,
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
        start: toBusinessTime(entry.clockIn),
        end: entry.clockOut ? toBusinessTime(entry.clockOut) : null,
        block: blockOf(entry.clockIn),
        minutes: entry.clockOut ? Math.round((entry.clockOut.getTime() - entry.clockIn.getTime()) / 60000) : null,
        corrected: correctedIds.has(entry.id),
        pendingCorrection: !entry.clockOut && now - entry.clockIn.getTime() > PENDING_AFTER_MS,
      });
      byDate.set(entry.workDate!, list);
    }

    const days: MonthDay[] = [...byDate.entries()].map(([date, dayEntries]) => ({
      date,
      entries: dayEntries,
      totalMinutes: dayEntries.reduce((sum, e) => sum + (e.minutes ?? 0), 0),
      issues: this.dayIssues(dayEntries),
    }));

    return {
      user: { id: user.id, name: user.name },
      year,
      month,
      days,
      totalMinutes: days.reduce((sum, d) => sum + d.totalMinutes, 0),
      issues: days.flatMap((d) => d.issues.map((message) => ({ date: d.date, message }))),
    };
  }

  // Things the "Registro diario de jornada" (one morning + one afternoon slot
  // per day) can't represent; the printed sheet is refused while any remain.
  private dayIssues(entries: MonthEntry[]): string[] {
    const issues: string[] = [];
    if (entries.some((e) => !e.clockOut)) issues.push('Fichaje sin hora de salida.');
    if (entries.length > 2) issues.push('Más de dos tramos en el día.');
    if (entries.filter((e) => e.block === 'morning').length > 1) issues.push('Dos tramos de mañana.');
    if (entries.filter((e) => e.block === 'afternoon').length > 1) issues.push('Dos tramos de tarde.');
    return issues;
  }

  async getSheet(userId: string, year: number, month: number) {
    const monthData = await this.getMonth(userId, year, month);
    const employee = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.nif', 'user.naf'])
      .where('user.id = :userId', { userId })
      .getOneOrFail();
    const company = await this.companySettingsService.get();
    const { lastDay } = monthBounds(year, month);
    const byDay = new Map(monthData.days.map((d) => [Number(d.date.slice(8, 10)), d]));

    const rows = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const data = day <= lastDay ? byDay.get(day) : undefined;
      const slot = (block: Block) => {
        const entry = data?.entries.find((e) => e.block === block);
        return entry ? { in: entry.start, out: entry.end } : null;
      };
      return {
        day,
        morning: slot('morning'),
        afternoon: slot('afternoon'),
        totalMinutes: data ? data.totalMinutes : null,
      };
    });

    return {
      company: { legalName: company.legalName, cif: company.cif, ccc: company.ccc },
      employee: { name: employee.name, nif: employee.nif ?? null, naf: employee.naf ?? null },
      year,
      month,
      rows,
      totalMinutes: monthData.totalMinutes,
      issues: monthData.issues,
    };
  }

  async create(dto: CreateTimeEntryDto, editorId: string) {
    const employee = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado.');
    }
    if (employee.role === 'kiosk') {
      throw new ConflictException('Esta cuenta no puede fichar.');
    }
    const { clockIn, clockOut } = this.parseTimes(dto);

    return this.withUniqueGuard(() =>
      this.entriesRepository.manager.transaction(async (manager) => {
        await this.assertNoOverlap(manager, dto.userId, clockIn, clockOut);
        const entry = await manager.save(
          manager.create(TimeEntry, { userId: dto.userId, clockIn, clockOut, workDate: dto.date }),
        );
        await this.logEdit(manager, {
          entry,
          editorId,
          action: 'create',
          reason: dto.reason,
          newClockIn: clockIn,
          newClockOut: clockOut,
        });
        return { id: entry.id };
      }),
    );
  }

  async update(id: string, dto: UpdateTimeEntryDto, editorId: string) {
    const { clockIn, clockOut } = this.parseTimes(dto);
    return this.withUniqueGuard(() =>
      this.entriesRepository.manager.transaction(async (manager) => {
        const entry = await manager.findOne(TimeEntry, { where: { id }, lock: { mode: 'pessimistic_write' } });
        if (!entry) {
          throw new NotFoundException('Fichaje no encontrado.');
        }
        await this.assertNoOverlap(manager, entry.userId, clockIn, clockOut, entry.id);
        const previousClockIn = entry.clockIn;
        const previousClockOut = entry.clockOut;
        entry.clockIn = clockIn;
        entry.clockOut = clockOut;
        entry.workDate = dto.date;
        await manager.save(entry);
        await this.logEdit(manager, {
          entry,
          editorId,
          action: 'update',
          reason: dto.reason,
          previousClockIn,
          previousClockOut,
          newClockIn: clockIn,
          newClockOut: clockOut,
        });
        return { id: entry.id };
      }),
    );
  }

  async remove(id: string, reason: string, editorId: string) {
    await this.entriesRepository.manager.transaction(async (manager) => {
      const entry = await manager.findOne(TimeEntry, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!entry) {
        throw new NotFoundException('Fichaje no encontrado.');
      }
      // Logged before the delete: the FK then sets time_entry_id to NULL, the
      // rest of the audit row stays.
      await this.logEdit(manager, {
        entry,
        editorId,
        action: 'delete',
        reason,
        previousClockIn: entry.clockIn,
        previousClockOut: entry.clockOut,
      });
      await manager.delete(TimeEntry, { id });
    });
  }

  async listEdits(id: string) {
    const edits = await this.editsRepository.find({
      where: { timeEntryId: id },
      relations: { editedBy: true },
      order: { createdAt: 'DESC' },
    });
    return edits.map((edit) => ({
      id: edit.id,
      action: edit.action,
      reason: edit.reason,
      editedBy: edit.editedBy?.name ?? null,
      createdAt: edit.createdAt,
      previous: edit.previousClockIn ? this.formatRange(edit.previousClockIn, edit.previousClockOut) : null,
      next: edit.newClockIn ? this.formatRange(edit.newClockIn, edit.newClockOut) : null,
    }));
  }

  private formatRange(clockIn: Date, clockOut: Date | null) {
    return `${toBusinessTime(clockIn)}–${clockOut ? toBusinessTime(clockOut) : '…'}`;
  }

  private parseTimes(dto: UpdateTimeEntryDto) {
    const clockIn = fromBusinessDateTime(dto.date, dto.clockIn);
    const clockOut = dto.clockOut ? fromBusinessDateTime(dto.date, dto.clockOut) : null;
    if (clockOut && clockOut <= clockIn) {
      throw new ConflictException('La hora de salida debe ser posterior a la de entrada.');
    }
    if (clockIn.getTime() > Date.now() || (clockOut && clockOut.getTime() > Date.now())) {
      throw new ConflictException('No se pueden registrar fichajes en el futuro.');
    }
    return { clockIn, clockOut };
  }

  // An open entry counts as running until infinity, so this also rejects a
  // second open entry for the same employee.
  private async assertNoOverlap(
    manager: EntityManager,
    userId: string,
    clockIn: Date,
    clockOut: Date | null,
    excludeId?: string,
  ) {
    const qb = manager
      .getRepository(TimeEntry)
      .createQueryBuilder('t')
      .where('t.user_id = :userId', { userId })
      .andWhere(`t.clock_in < COALESCE(CAST(:clockOut AS timestamptz), 'infinity'::timestamptz)`, { clockOut })
      .andWhere(`CAST(:clockIn AS timestamptz) < COALESCE(t.clock_out, 'infinity'::timestamptz)`, { clockIn });
    if (excludeId) {
      qb.andWhere('t.id != :excludeId', { excludeId });
    }
    if (await qb.getExists()) {
      throw new ConflictException('Se solapa con otro fichaje de ese empleado.');
    }
  }

  private async logEdit(
    manager: EntityManager,
    data: {
      entry: TimeEntry;
      editorId: string;
      action: TimeEntryEdit['action'];
      reason: string;
      previousClockIn?: Date | null;
      previousClockOut?: Date | null;
      newClockIn?: Date | null;
      newClockOut?: Date | null;
    },
  ) {
    await manager.save(
      manager.create(TimeEntryEdit, {
        timeEntryId: data.entry.id,
        userId: data.entry.userId,
        editedById: data.editorId,
        action: data.action,
        reason: data.reason,
        previousClockIn: data.previousClockIn ?? null,
        previousClockOut: data.previousClockOut ?? null,
        newClockIn: data.newClockIn ?? null,
        newClockOut: data.newClockOut ?? null,
      }),
    );
  }

  // Concurrent writes that both passed assertNoOverlap can still collide on
  // the one-open-entry index.
  private async withUniqueGuard<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error: any) {
      if (error?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new ConflictException('Ese empleado ya tiene un fichaje abierto.');
      }
      throw error;
    }
  }
}
