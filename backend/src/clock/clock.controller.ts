import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClockService } from './clock.service';
import { PunchDto } from './dto/punch.dto';

@Controller('clock')
export class ClockController {
  constructor(private readonly clockService: ClockService) {}

  @Get('token')
  @Roles('admin', 'kiosk')
  getToken(@Req() req: Request) {
    return this.clockService.issueToken(req.user!.sub);
  }

  // No @Roles: any authenticated user (admin/employee/kiosk) reaches here via
  // the global JwtAuthGuard — ClockService itself rejects kiosk accounts with
  // a specific message, since that's a business rule, not an access-control one.
  @Post('punch')
  punch(@Req() req: Request, @Body() dto: PunchDto) {
    return this.clockService.punch(req.user!.sub, dto.token);
  }
}
