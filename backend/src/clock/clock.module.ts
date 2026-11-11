import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { User } from '../users/user.entity';
import { ClockController } from './clock.controller';
import { clockQrJwtProvider } from './clock-qr-jwt.provider';
import { ClockTokenService } from './clock-token.service';
import { ClockService } from './clock.service';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntryEdit } from './time-entry-edit.entity';
import { TimeEntry } from './time-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, TimeEntryEdit, User]), CompanySettingsModule],
  controllers: [ClockController, TimeEntriesController],
  providers: [clockQrJwtProvider, ClockTokenService, ClockService, TimeEntriesService],
})
export class ClockModule {}
