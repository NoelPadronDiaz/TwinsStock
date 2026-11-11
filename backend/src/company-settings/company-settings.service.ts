import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySettings } from './company-settings.entity';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class CompanySettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(CompanySettings)
    private readonly settingsRepository: Repository<CompanySettings>,
  ) {}

  // Ensure the single row exists; never overwrites it. The advisory lock keeps
  // two concurrent cold starts from both inserting it.
  async onModuleInit() {
    await this.settingsRepository.manager.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext('company_settings_seed'))`);
      if ((await manager.count(CompanySettings)) === 0) {
        await manager.save(manager.create(CompanySettings, { legalName: null, cif: null, ccc: null }));
      }
    });
  }

  async get(): Promise<CompanySettings> {
    const [settings] = await this.settingsRepository.find({ take: 1 });
    return settings ?? this.settingsRepository.save(this.settingsRepository.create({}));
  }

  async update(dto: UpdateCompanySettingsDto) {
    const settings = await this.get();
    if (dto.legalName !== undefined) settings.legalName = clean(dto.legalName);
    if (dto.cif !== undefined) settings.cif = clean(dto.cif)?.toUpperCase() ?? null;
    if (dto.ccc !== undefined) settings.ccc = clean(dto.ccc);
    return this.settingsRepository.save(settings);
  }
}
