import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from '../devices/devices.module';
import { ExportController } from './export.controller';
import { ReadingEntity } from './reading.entity';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReadingEntity]), DevicesModule],
  controllers: [ReadingsController, ExportController],
  providers: [ReadingsService],
  exports: [ReadingsService],
})
export class ReadingsModule {}
