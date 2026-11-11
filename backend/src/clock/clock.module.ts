import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { ClockController } from './clock.controller';
import { clockQrJwtProvider } from './clock-qr-jwt.provider';
import { ClockTokenService } from './clock-token.service';
import { ClockService } from './clock.service';
import { TimeEntry } from './time-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, User])],
  controllers: [ClockController],
  providers: [clockQrJwtProvider, ClockTokenService, ClockService],
})
export class ClockModule {}
