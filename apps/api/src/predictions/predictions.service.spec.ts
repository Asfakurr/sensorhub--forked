import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Reading } from '@sensorhub/shared';
import { DevicesService } from '../devices/devices.service';
import { ReadingsService } from '../readings/readings.service';
import { PredictionsService } from './predictions.service';

describe('PredictionsService', () => {
  const devicesService = {
    findOne: jest.fn(),
  };
  const readingsService = {
    findForDevice: jest.fn(),
  };

  let service: PredictionsService;

  const makeReading = (temperature: number, recordedAt: string): Reading => ({
    id: `reading-${recordedAt}`,
    deviceId: 'dev-001',
    temperature,
    humidity: 50,
    battery: 90,
    recordedAt,
  });

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:30:00.000Z'));
    jest.clearAllMocks();
    devicesService.findOne.mockResolvedValue({ id: 'dev-001' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        PredictionsService,
        { provide: DevicesService, useValue: devicesService },
        { provide: ReadingsService, useValue: readingsService },
      ],
    }).compile();
    service = moduleRef.get(PredictionsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('predicts a rising temperature trend at each horizon', async () => {
    readingsService.findForDevice.mockResolvedValue([
      makeReading(10, '2026-01-01T00:00:00.000Z'),
      makeReading(11, '2026-01-01T00:01:00.000Z'),
      makeReading(12, '2026-01-01T00:02:00.000Z'),
    ]);

    const result = await service.getPredictionForDevice('dev-001', {});

    expect(readingsService.findForDevice).toHaveBeenCalledWith(
      'dev-001',
      new Date('2026-01-01T00:00:00.000Z'),
    );
    expect(result).toMatchObject({
      deviceId: 'dev-001',
      sensorType: 'temperature',
      baseTemperature: 10,
      baseRecordedAt: '2026-01-01T00:00:00.000Z',
      sampleCount: 3,
      slopePerMinute: 1,
      status: 'ready',
    });
    expect(result.predictions.map(({ predictedTemperature }) => predictedTemperature)).toEqual([
      13, 17, 22,
    ]);
    expect(result.predictions.map(({ targetTime }) => targetTime)).toEqual([
      '2026-01-01T00:03:00.000Z',
      '2026-01-01T00:07:00.000Z',
      '2026-01-01T00:12:00.000Z',
    ]);
  });

  it('predicts a falling temperature trend', async () => {
    readingsService.findForDevice.mockResolvedValue([
      makeReading(20, '2026-01-01T00:00:00.000Z'),
      makeReading(19, '2026-01-01T00:01:00.000Z'),
      makeReading(18, '2026-01-01T00:02:00.000Z'),
    ]);

    const result = await service.getPredictionForDevice('dev-001', {});

    expect(result.slopePerMinute).toBe(-1);
    expect(result.predictions.map(({ predictedTemperature }) => predictedTemperature)).toEqual([
      17, 13, 8,
    ]);
  });

  it('returns ready predictions with a zero slope for flat temperature', async () => {
    readingsService.findForDevice.mockResolvedValue([
      makeReading(5, '2026-01-01T00:00:00.000Z'),
      makeReading(5, '2026-01-01T00:01:00.000Z'),
      makeReading(5, '2026-01-01T00:02:00.000Z'),
    ]);

    const result = await service.getPredictionForDevice('dev-001', {});

    expect(result.status).toBe('ready');
    expect(result.slopePerMinute).toBe(0);
    expect(result.predictions.map(({ predictedTemperature }) => predictedTemperature)).toEqual([
      5, 5, 5,
    ]);
  });

  it.each([
    { name: 'zero readings', readings: [], sampleCount: 0, baseTemperature: null },
    {
      name: 'one reading',
      readings: [makeReading(21.25, '2026-01-01T00:00:00.000Z')],
      sampleCount: 1,
      baseTemperature: 21.25,
    },
  ])('returns insufficient_data for $name', async ({ readings, sampleCount, baseTemperature }) => {
    readingsService.findForDevice.mockResolvedValue(readings);

    const result = await service.getPredictionForDevice('dev-001', {});

    expect(result).toMatchObject({
      sampleCount,
      baseTemperature,
      slopePerMinute: 0,
      status: 'insufficient_data',
      predictions: [],
    });
  });

  it('returns insufficient_data when all readings have the same timestamp', async () => {
    readingsService.findForDevice.mockResolvedValue([
      makeReading(20, '2026-01-01T00:00:00.000Z'),
      makeReading(21, '2026-01-01T00:00:00.000Z'),
    ]);

    const result = await service.getPredictionForDevice('dev-001', {});

    expect(result.status).toBe('insufficient_data');
    expect(result.predictions).toEqual([]);
    expect(result.slopePerMinute).toBe(0);
  });

  it('propagates the device not found 404', async () => {
    const notFound = new NotFoundException('Device dev-001 not found');
    devicesService.findOne.mockRejectedValue(notFound);

    await expect(service.getPredictionForDevice('dev-001', {})).rejects.toBe(notFound);
    expect(notFound.getStatus()).toBe(404);
    expect(readingsService.findForDevice).not.toHaveBeenCalled();
  });
});
