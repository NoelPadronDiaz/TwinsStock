import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
import { WeekTemplateRowDto, CreateWeekTemplateDto, UpdateWeekTemplateDto } from './dto/week-template.dto';
import { timeRangesOverlap } from './schedule-date.util';
import { ShiftTemplate } from './shift-template.entity';
import { WeekTemplate } from './week-template.entity';

const POSTGRES_UNIQUE_VIOLATION = '23505';
const DUPLICATE_NAME_MESSAGE = 'Ya existe una plantilla con ese nombre.';

@Injectable()
export class WeekTemplatesService implements OnModuleInit {
  constructor(
    @InjectRepository(WeekTemplate)
    private readonly templatesRepository: Repository<WeekTemplate>,
  ) {}

  // Rows from the old two-fixed-templates model have no week_template_id.
  // Group them per (user, legacy period) into templates named "Mañana" /
  // "Tarde". Idempotent (only touches NULL rows); the advisory lock keeps two
  // concurrent cold starts from both inserting.
  async onModuleInit() {
    await this.templatesRepository.manager.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext('week_templates_backfill'))`);
      await manager.query(`
        INSERT INTO week_templates (user_id, name)
        SELECT DISTINCT user_id, CASE WHEN period = 'afternoon' THEN 'Tarde' ELSE 'Mañana' END
        FROM shift_templates
        WHERE week_template_id IS NULL
        ON CONFLICT (user_id, name) DO NOTHING
      `);
      await manager.query(`
        UPDATE shift_templates st
        SET week_template_id = wt.id
        FROM week_templates wt
        WHERE st.week_template_id IS NULL
          AND wt.user_id = st.user_id
          AND wt.name = CASE WHEN st.period = 'afternoon' THEN 'Tarde' ELSE 'Mañana' END
      `);
    });
  }

  async findForUser(userId: string) {
    const templates = await this.templatesRepository.find({
      where: { userId },
      relations: { rows: true },
      order: { createdAt: 'ASC', rows: { weekday: 'ASC', startTime: 'ASC' } },
    });
    return templates.map((template) => this.toResponse(template));
  }

  async findOneWithRows(id: string) {
    const template = await this.templatesRepository.findOne({ where: { id }, relations: { rows: true } });
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada.');
    }
    return template;
  }

  async create(dto: CreateWeekTemplateDto) {
    this.validateRows(dto.rows);
    const id = await this.withDuplicateNameGuard(() =>
      this.templatesRepository.manager.transaction(async (manager) => {
        await this.assertNameFree(manager, dto.userId, dto.name);
        const template = await manager.save(manager.create(WeekTemplate, { userId: dto.userId, name: dto.name }));
        await this.insertRows(manager, template, dto.rows);
        return template.id;
      }),
    );
    return this.toResponse(await this.findOneWithRows(id));
  }

  async update(id: string, dto: UpdateWeekTemplateDto) {
    this.validateRows(dto.rows);
    const template = await this.findOneWithRows(id);
    await this.withDuplicateNameGuard(() =>
      this.templatesRepository.manager.transaction(async (manager) => {
        await this.assertNameFree(manager, template.userId, dto.name, template.id);
        await manager.update(WeekTemplate, { id }, { name: dto.name });
        await manager.delete(ShiftTemplate, { weekTemplateId: id });
        await this.insertRows(manager, template, dto.rows);
      }),
    );
    return this.toResponse(await this.findOneWithRows(id));
  }

  async remove(id: string) {
    const result = await this.templatesRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Plantilla no encontrada.');
    }
  }

  private async insertRows(manager: EntityManager, template: WeekTemplate, rows: WeekTemplateRowDto[]) {
    if (rows.length === 0) return;
    await manager.save(
      rows.map((row) =>
        manager.create(ShiftTemplate, {
          userId: template.userId,
          weekTemplateId: template.id,
          weekday: row.weekday,
          startTime: row.startTime,
          endTime: row.endTime,
        }),
      ),
    );
  }

  private async assertNameFree(manager: EntityManager, userId: string, name: string, excludeId?: string) {
    const clash = await manager.getRepository(WeekTemplate).exists({
      where: { userId, name, ...(excludeId ? { id: Not(excludeId) } : {}) },
    });
    if (clash) {
      throw new ConflictException(DUPLICATE_NAME_MESSAGE);
    }
  }

  // The unique (user_id, name) index is the backstop for two concurrent
  // creates/renames that both passed assertNameFree.
  private async withDuplicateNameGuard<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error: any) {
      if (error?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new ConflictException(DUPLICATE_NAME_MESSAGE);
      }
      throw error;
    }
  }

  private validateRows(rows: WeekTemplateRowDto[]) {
    for (const row of rows) {
      if (row.endTime <= row.startTime) {
        throw new ConflictException('La hora de fin debe ser posterior a la de inicio en la plantilla.');
      }
    }

    const byWeekday = new Map<number, WeekTemplateRowDto[]>();
    for (const row of rows) {
      const list = byWeekday.get(row.weekday) ?? [];
      list.push(row);
      byWeekday.set(row.weekday, list);
    }
    for (const list of byWeekday.values()) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (timeRangesOverlap(list[i].startTime, list[i].endTime, list[j].startTime, list[j].endTime)) {
            throw new ConflictException('Hay tramos solapados en la plantilla.');
          }
        }
      }
    }
  }

  private toResponse(template: WeekTemplate) {
    return {
      id: template.id,
      userId: template.userId,
      name: template.name,
      createdAt: template.createdAt,
      rows: (template.rows ?? [])
        .map((row) => ({ weekday: row.weekday, startTime: row.startTime, endTime: row.endTime }))
        .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)),
    };
  }
}
