import { Body, Controller, Get, Put } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Controller('company-settings')
@Roles('admin')
export class CompanySettingsController {
  constructor(private readonly companySettingsService: CompanySettingsService) {}

  @Get()
  get() {
    return this.companySettingsService.get();
  }

  @Put()
  update(@Body() dto: UpdateCompanySettingsDto) {
    return this.companySettingsService.update(dto);
  }
}
