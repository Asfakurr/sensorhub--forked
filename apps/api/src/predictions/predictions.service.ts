import { Injectable } from '@nestjs/common';
import type { SensorPrediction } from '@sensorhub/shared';
import { ReadingsService } from '../readings/readings.service';
import { QueryPredictionDto } from './dto/query-prediction.dto';
import { linearRegression, slopePerMinuteFromPerMs } from './linear-regression';

@Injectable()
export class PredictionsService {
  constructor(private readonly readingsService: ReadingsService) {}

  async getPredictionForDevice(deviceId: string, query: QueryPredictionDto): Promise<SensorPrediction> {
    const limit = query.limit ?? 50;
    const recent = await this.readingsService.findRecent({ deviceId, limit });
    const readings = [...recent].reverse();

    const calculatedAtDate = new Date();
    const calculatedAt = calculatedAtDate.toISOString();

    if (!readings || readings.length === 0) {
      return {
        deviceId,
        sensorType: 'temperature',
        calculatedAt,
        sampleCount: 0,
        trendSlopePerMinute: 0,
        predictions: [],
        status: 'insufficient_data',
        warning: 'No temperature readings available for this device.',
      };
    }

    if (readings.length === 1) {
      const only = readings[0];
      const baseTemp = Number.isFinite(only.temperature) ? only.temperature : 0;
      return {
        deviceId,
        sensorType: 'temperature',
        calculatedAt,
        sampleCount: 1,
        trendSlopePerMinute: 0,
        predictions: [
          {
            horizonMinutes: 1,
            targetTime: new Date(calculatedAtDate.getTime() + 1 * 60_000).toISOString(),
            predictedTemperature: baseTemp,
          },
          {
            horizonMinutes: 5,
            targetTime: new Date(calculatedAtDate.getTime() + 5 * 60_000).toISOString(),
            predictedTemperature: baseTemp,
          },
          {
            horizonMinutes: 10,
            targetTime: new Date(calculatedAtDate.getTime() + 10 * 60_000).toISOString(),
            predictedTemperature: baseTemp,
          },
        ],
        status: 'insufficient_data',
        warning: 'At least 2 readings are required for a trend-based prediction.',
      };
    }

    const rawPoints = readings
      .map((r) => ({
        timestamp: new Date(r.recordedAt).getTime(),
        value: r.temperature,
      }))
      .filter((p) => Number.isFinite(p.timestamp) && Number.isFinite(p.value));

    if (rawPoints.length < 2) {
      return {
        deviceId,
        sensorType: 'temperature',
        calculatedAt,
        sampleCount: rawPoints.length,
        trendSlopePerMinute: 0,
        predictions: [],
        status: 'insufficient_data',
        warning: 'Not enough valid temperature readings to compute a prediction.',
      };
    }

    const t0 = rawPoints[0].timestamp;
    const points = rawPoints.map((p) => ({ timestamp: p.timestamp - t0, value: p.value }));

    const { slope, intercept } = linearRegression(points);
    const slopePerMinute = slopePerMinuteFromPerMs(slope);
    const lastRelTs = points[points.length - 1].timestamp;
    const lastAbsTs = rawPoints[rawPoints.length - 1].timestamp;

    const horizons = [1, 5, 10];
    const predictions = horizons.map((m) => {
      const deltaMs = m * 60_000;
      const targetRelMs = lastRelTs + deltaMs;
      const predicted = slope * targetRelMs + intercept;
      const targetMs = lastAbsTs + deltaMs;
      return {
        horizonMinutes: m,
        targetTime: new Date(targetMs).toISOString(),
        predictedTemperature: Number.isFinite(predicted) ? predicted : 0,
      };
    });

    return {
      deviceId,
      sensorType: 'temperature',
      calculatedAt,
      sampleCount: points.length,
      trendSlopePerMinute: slopePerMinute,
      predictions,
      status: 'ok',
    };
  }
}
