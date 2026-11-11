import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// Second, independent JwtService instance (plain class, safe to instantiate
// outside the DI container) with its own secret — separate from the global
// JwtModule used for user sessions. The QR token proves "physically at the
// store right now"; it carries no user identity.
export const CLOCK_QR_JWT = 'CLOCK_QR_JWT';

export const clockQrJwtProvider: Provider = {
  provide: CLOCK_QR_JWT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    new JwtService({
      secret: config.get<string>('CLOCK_QR_SECRET', 'dev-clock-secret-change-me'),
      signOptions: { expiresIn: '60s' },
    }),
};
