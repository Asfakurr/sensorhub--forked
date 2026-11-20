import { Controller, Get, Param, Query } from '@nestjs/common';
import type { SensorPrediction } from '@sensorhub/shared';
import { QueryPredictionsDto } from './dto/query-predictions.dto';
import { PredictionsService } from './predictions.service';

@Controller('devices')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get(':id/predictions')
  getDevicePrediction(
    @Param('id') deviceId: string,
    @Query() query: QueryPredictionsDto,
  ): Promise<SensorPrediction> {
    return this.predictionsService.getPredictionForDevice(deviceId, query);
  }
}
