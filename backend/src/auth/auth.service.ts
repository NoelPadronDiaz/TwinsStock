import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersService.validateCredentials(username, password);

    const payload: JwtPayload = { sub: user.id, username: user.username, role: user.role };
    // Kiosk is a shared device account, not a person logging in every shift —
    // it needs a long-lived session instead of the normal JWT_EXPIRES_IN.
    const accessToken =
      user.role === 'kiosk'
        ? this.jwtService.sign(payload, { expiresIn: this.config.get<string>('JWT_KIOSK_EXPIRES_IN', '30d') })
        : this.jwtService.sign(payload);

    return { accessToken, user: this.usersService.toSafeUser(user) };
  }
}
