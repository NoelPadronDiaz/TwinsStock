import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ClockTokenService } from './clock-token.service';
import { TimeEntry } from './time-entry.entity';

const DEBOUNCE_MS = 60_000;
const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ClockService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntriesRepository: Repository<TimeEntry>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly tokenService: ClockTokenService,
  ) {}

  // Re-reads `active` fresh — a kiosk JWT can live 30 days, long enough for
  // an admin to deactivate the device in the meantime.
  async issueToken(kioskUserId: string) {
    const kiosk = await this.usersRepository.findOneOrFail({ where: { id: kioskUserId } });
    if (!kiosk.active) {
      throw new ForbiddenException('Este dispositivo está desactivado.');
    }
    return { token: this.tokenService.sign() };
  }

  async punch(userId: string, qrToken: string) {
    this.tokenService.verify(qrToken);

    // Re-read fresh too: an employee JWT can live up to JWT_EXPIRES_IN, and
    // role/active can change under it in the meantime.
    const user = await this.usersRepository.findOneOrFail({ where: { id: userId } });
    if (!user.active) {
      throw new ForbiddenException('Tu cuenta está desactivada.');
    }
    if (user.role === 'kiosk') {
      throw new ForbiddenException('Esta cuenta no puede fichar.');
    }

    try {
      return await this.toggle(userId);
    } catch (error: any) {
      if (error?.code === POSTGRES_UNIQUE_VIOLATION) {
        // Lost the race to open a first entry — someone else's concurrent
        // scan got there first. Treat it the same as finding it already open.
        return this.toggle(userId);
      }
      throw error;
    }
  }

  private async toggle(userId: string) {
    return this.timeEntriesRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(TimeEntry);
      const last = await repo
        .createQueryBuilder('t')
        .where('t.user_id = :userId', { userId })
        .orderBy('t.clock_in', 'DESC')
        .limit(1)
        .setLock('pessimistic_write')
        .getOne();

      const now = new Date();

      if (last) {
        const lastEventAt = last.clockOut ?? last.clockIn;
        if (now.getTime() - lastEventAt.getTime() < DEBOUNCE_MS) {
          // Same scan registered twice within a minute — don't toggle again.
          return {
            action: last.clockOut ? ('clock-out' as const) : ('clock-in' as const),
            at: lastEventAt,
            clockIn: last.clockIn,
          };
        }
        if (!last.clockOut) {
          last.clockOut = now;
          await manager.save(last);
          return { action: 'clock-out' as const, at: now, clockIn: last.clockIn };
        }
      }

      const entry = manager.create(TimeEntry, { userId, clockIn: now });
      await manager.save(entry);
      return { action: 'clock-in' as const, at: now, clockIn: now };
    });
  }
}
