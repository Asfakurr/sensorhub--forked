import { Test } from '@nestjs/testing';
import { ReadingsService } from '../readings/readings.service';
import { PredictionsService } from './predictions.service';

describe('PredictionsService', () => {
  const readingsService = {
    findRecent: jest.fn(),
  };

  let service: PredictionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [PredictionsService, { provide: ReadingsService, useValue: readingsService }],
    }).compile();
    service = moduleRef.get(PredictionsService);
  });

  it('returns insufficient_data with empty warning when no readings', async () => {
    readingsService.findRecent.mockResolvedValue([]);
    const res = await service.getPredictionForDevice('dev-001', {});
    expect(res.status).toBe('insufficient_data');
    expect(res.sampleCount).toBe(0);
    expect(res.predictions).toEqual([]);
    expect(res.warning).toBeTruthy();
  });

  it('returns insufficient_data with 1 reading and flat predictions', async () => {
    readingsService.findRecent.mockResolvedValue([
      {
        id: 'r1',
        deviceId: 'dev-001',
        temperature: 20,
        humidity: 50,
        battery: 90,
        recordedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    const res = await service.getPredictionForDevice('dev-001', {});
    expect(res.status).toBe('insufficient_data');
    expect(res.sampleCount).toBe(1);
    expect(res.predictions).toHaveLength(3);
    expect(res.predictions[0].predictedTemperature).toBe(20);
    expect(res.predictions[1].predictedTemperature).toBe(20);
    expect(res.predictions[2].predictedTemperature).toBe(20);
  });

  it('computes ok prediction for trending data', async () => {
    // findRecent returns newest first
    readingsService.findRecent.mockResolvedValue([
      {
        id: 'r3',
        deviceId: 'dev-001',
        temperature: 12,
        humidity: 50,
        battery: 90,
        recordedAt: '2026-01-01T00:02:00.000Z',
      },
      {
        id: 'r2',
        deviceId: 'dev-001',
        temperature: 11,
        humidity: 50,
        battery: 90,
        recordedAt: '2026-01-01T00:01:00.000Z',
      },
      {
        id: 'r1',
        deviceId: 'dev-001',
        temperature: 10,
        humidity: 50,
        battery: 90,
        recordedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    const res = await service.getPredictionForDevice('dev-001', {});
    expect(res.status).toBe('ok');
    expect(res.sampleCount).toBe(3);
    expect(res.trendSlopePerMinute).toBeCloseTo(1, 6);
    expect(res.predictions).toHaveLength(3);
    expect(res.predictions.find((p) => p.horizonMinutes === 1)?.predictedTemperature).toBeCloseTo(13, 6);
    expect(res.predictions.find((p) => p.horizonMinutes === 5)?.predictedTemperature).toBeCloseTo(17, 6);
    expect(res.predictions.find((p) => p.horizonMinutes === 10)?.predictedTemperature).toBeCloseTo(22, 6);
  });
});
