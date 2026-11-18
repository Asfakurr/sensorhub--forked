import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from './devices/devices.module';
import { HealthController } from './health/health.controller';
import { ReadingsModule } from './readings/readings.module';
import { StreamModule } from './stream/stream.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ??
        `postgres://sensorhub:sensorhub@localhost:${process.env.DB_PORT ?? 5432}/sensorhub`,
      autoLoadEntities: true,
      // Dev/training only: schema follows the entities. Set DB_SYNC=false to turn off.
      synchronize: process.env.DB_SYNC !== 'false',
      retryAttempts: 20,
      retryDelay: 2000,
    }),
    StreamModule,
    DevicesModule,
    ReadingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
