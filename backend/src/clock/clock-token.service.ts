import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CLOCK_QR_JWT } from './clock-qr-jwt.provider';

const QR_PURPOSE = 'clock-qr';

@Injectable()
export class ClockTokenService {
  constructor(@Inject(CLOCK_QR_JWT) private readonly qrJwt: JwtService) {}

  sign(): string {
    return this.qrJwt.sign({ purpose: QR_PURPOSE });
  }

  verify(token: string): void {
    let payload: { purpose?: string };
    try {
      payload = this.qrJwt.verify(token);
    } catch {
      throw new UnauthorizedException('El código ha caducado. Escanéalo de nuevo.');
    }
    if (payload.purpose !== QR_PURPOSE) {
      throw new UnauthorizedException('El código ha caducado. Escanéalo de nuevo.');
    }
  }
}
