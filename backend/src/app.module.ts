import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CategoriesModule } from './categories/categories.module';
import { ConsumablesModule } from './consumables/consumables.module';
import { ConsumptionLogsModule } from './consumption-logs/consumption-logs.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const useSsl = config.get<string>('DB_SSL', databaseUrl ? 'true' : 'false') === 'true';

        return {
          type: 'postgres',
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: config.get<string>('DB_HOST', 'localhost'),
                port: config.get<number>('DB_PORT', 5432),
                username: config.get<string>('DB_USERNAME', 'twinsstock'),
                password: config.get<string>('DB_PASSWORD', 'twinsstock'),
                database: config.get<string>('DB_DATABASE', 'twinsstock'),
              }),
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: true,
        } as TypeOrmModuleOptions;
      },
    }),
    CategoriesModule,
    ConsumablesModule,
    ConsumptionLogsModule,
    StatsModule,
  ],
})
export class AppModule {}
