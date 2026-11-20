import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { ReadingsModule } from '../readings/readings.module';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [DevicesModule, ReadingsModule],
  controllers: [PredictionsController],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
