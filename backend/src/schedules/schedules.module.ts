import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftTemplate } from './shift-template.entity';
import { Shift } from './shift.entity';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { WeekTemplate } from './week-template.entity';
import { WeekTemplatesController } from './week-templates.controller';
import { WeekTemplatesService } from './week-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, ShiftTemplate, WeekTemplate])],
  controllers: [ShiftsController, WeekTemplatesController],
  providers: [ShiftsService, WeekTemplatesService],
  exports: [ShiftsService],
})
export class SchedulesModule {}
