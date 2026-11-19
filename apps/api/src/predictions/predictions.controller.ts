import { Controller, Get, Param, Query } from '@nestjs/common';
import type { SensorPrediction } from '@sensorhub/shared';
import { QueryPredictionDto } from './dto/query-prediction.dto';
import { PredictionsService } from './predictions.service';

@Controller()
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get('devices/:deviceId/prediction')
  getDevicePrediction(
    @Param('deviceId') deviceId: string,
    @Query() query: QueryPredictionDto,
  ): Promise<SensorPrediction> {
    return this.predictionsService.getPredictionForDevice(deviceId, query);
  }

  @Get('predictions/:deviceId')
  getPrediction(
    @Param('deviceId') deviceId: string,
    @Query() query: QueryPredictionDto,
  ): Promise<SensorPrediction> {
    return this.predictionsService.getPredictionForDevice(deviceId, query);
  }
}
