import { Injectable } from '@nestjs/common';
import type { Reading, SensorPrediction } from '@sensorhub/shared';
import { DevicesService } from '../devices/devices.service';
import { ReadingsService } from '../readings/readings.service';
import { QueryPredictionsDto } from './dto/query-predictions.dto';
import { linearRegression } from './linear-regression';

const DEFAULT_WINDOW_MINUTES = 30;
const PREDICTION_HORIZONS_MINUTES = [1, 5, 10] as const;
const MILLISECONDS_PER_MINUTE = 60_000;

interface TimedReading {
  reading: Reading;
  timestampMs: number;
}

function round(value: number, decimalPlaces: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimalPlaces));
}

function toIso(timestampMs: number, fallback: string): string {
  const date = new Date(timestampMs);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

@Injectable()
export class PredictionsService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly readingsService: ReadingsService,
  ) {}

  async getPredictionForDevice(
    deviceId: string,
    query: QueryPredictionsDto = {},
  ): Promise<SensorPrediction> {
    await this.devicesService.findOne(deviceId);

    const calculatedAtDate = new Date();
    const calculatedAt = calculatedAtDate.toISOString();
    const requestedWindow = query.windowMinutes ?? DEFAULT_WINDOW_MINUTES;
    const windowMinutes =
      Number.isFinite(requestedWindow) && requestedWindow >= 1
        ? requestedWindow
        : DEFAULT_WINDOW_MINUTES;
    const since = new Date(
      calculatedAtDate.getTime() - windowMinutes * MILLISECONDS_PER_MINUTE,
    );
    const readings = await this.readingsService.findForDevice(deviceId, since);
    const timedReadings = this.getTimedReadings(readings);
    const base = timedReadings[0];
    const baseTemperature = base?.reading.temperature ?? null;
    const baseRecordedAt = base ? toIso(base.timestampMs, calculatedAt) : null;

    if (timedReadings.length < 2) {
      return this.insufficientData(
        deviceId,
        calculatedAt,
        baseTemperature,
        baseRecordedAt,
        timedReadings.length,
      );
    }

    const last = timedReadings[timedReadings.length - 1];
    const timeRangeSeconds = (last.timestampMs - base.timestampMs) / 1000;
    if (!(timeRangeSeconds > 0) || !Number.isFinite(timeRangeSeconds)) {
      return this.insufficientData(
        deviceId,
        calculatedAt,
        baseTemperature,
        baseRecordedAt,
        timedReadings.length,
      );
    }

    const points = timedReadings.map(({ reading, timestampMs }) => ({
      timestamp: (timestampMs - base.timestampMs) / 1000,
      value: reading.temperature,
    }));
    const { slope, intercept } = linearRegression(points);
    if (!Number.isFinite(slope) || !Number.isFinite(intercept)) {
      return this.insufficientData(
        deviceId,
        calculatedAt,
        baseTemperature,
        baseRecordedAt,
        timedReadings.length,
      );
    }

    const slopePerMinute = round(slope * 60, 3);
    const predictions = PREDICTION_HORIZONS_MINUTES.map((horizonMinutes) => {
      const horizonSeconds = horizonMinutes * 60;
      const predictedTemperature = slope * (timeRangeSeconds + horizonSeconds) + intercept;
      const targetTime = toIso(
        last.timestampMs + horizonMinutes * MILLISECONDS_PER_MINUTE,
        calculatedAt,
      );

      return {
        horizonMinutes,
        targetTime,
        predictedTemperature: round(predictedTemperature, 2),
      };
    });

    return {
      deviceId,
      sensorType: 'temperature',
      calculatedAt,
      baseTemperature,
      baseRecordedAt,
      sampleCount: timedReadings.length,
      slopePerMinute,
      status: 'ready',
      predictions,
    };
  }

  private getTimedReadings(readings: Reading[]): TimedReading[] {
    return readings
      .map((reading) => ({
        reading,
        timestampMs: new Date(reading.recordedAt).getTime(),
      }))
      .filter(
        ({ reading, timestampMs }) =>
          Number.isFinite(timestampMs) && Number.isFinite(reading.temperature),
      )
      .sort((a, b) => a.timestampMs - b.timestampMs);
  }

  private insufficientData(
    deviceId: string,
    calculatedAt: string,
    baseTemperature: number | null,
    baseRecordedAt: string | null,
    sampleCount: number,
  ): SensorPrediction {
    return {
      deviceId,
      sensorType: 'temperature',
      calculatedAt,
      baseTemperature,
      baseRecordedAt,
      sampleCount,
      slopePerMinute: 0,
      status: 'insufficient_data',
      predictions: [],
    };
  }
}
