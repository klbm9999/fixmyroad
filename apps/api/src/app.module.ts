import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BuildersModule } from './builders/builders.module';
import { CacheModule } from './cache/cache.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { IssuesModule } from './issues/issues.module';
import { MapModule } from './map/map.module';
import { QualityModule } from './quality/quality.module';
import { RemindersModule } from './reminders/reminders.module';
import { ReportsModule } from './reports/reports.module';
import { RoadsModule } from './roads/roads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CacheModule,
    AuditModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 60 },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'fixmyroad',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: process.env.DB_LOGGING === 'true',
      }),
    }),
    AuthModule,
    ReportsModule,
    RoadsModule,
    IssuesModule,
    MapModule,
    QualityModule,
    BuildersModule,
    ComplaintsModule,
    RemindersModule,
  ],
})
export class AppModule {}
