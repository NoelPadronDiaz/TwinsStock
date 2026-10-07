import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftTemplate } from './shift-template.entity';
import { Shift } from './shift.entity';
import { ShiftTemplatesController } from './shift-templates.controller';
import { ShiftTemplatesService } from './shift-templates.service';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, ShiftTemplate])],
  controllers: [ShiftsController, ShiftTemplatesController],
  providers: [ShiftsService, ShiftTemplatesService],
  exports: [ShiftsService],
})
export class SchedulesModule {}
