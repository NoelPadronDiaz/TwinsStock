import { ConflictException, Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureAdminSeeded();
  }

  private async ensureAdminSeeded() {
    const count = await this.usersRepository.count();
    if (count > 0) return;

    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!password) {
      this.logger.warn(
        'No hay usuarios y ADMIN_PASSWORD no está definida: no se puede crear el admin inicial. Define ADMIN_PASSWORD (y opcionalmente ADMIN_USERNAME/ADMIN_NAME) y reinicia.',
      );
      return;
    }

    const username = this.config.get<string>('ADMIN_USERNAME', 'admin');
    const name = this.config.get<string>('ADMIN_NAME', 'Administrador');

    await this.usersRepository.save(
      this.usersRepository.create({
        username,
        name,
        passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
        role: 'admin',
        active: true,
      }),
    );
    this.logger.log(`Usuario admin inicial creado: ${username}`);
  }

  findAll() {
    return this.usersRepository.find({ order: { createdAt: 'ASC' } });
  }

  findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  findOne(id: string) {
    return this.usersRepository.findOneOrFail({ where: { id } });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese nombre de usuario.');
    }

    return this.usersRepository.save(
      this.usersRepository.create({
        username: dto.username,
        name: dto.name,
        role: dto.role,
        passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS),
      }),
    );
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.usersRepository.save(user);
  }

  toSafeUser(user: User) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async validateCredentials(username: string, password: string) {
    const user = await this.findByUsername(username);
    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    return user;
  }
}
