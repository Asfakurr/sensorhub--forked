import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Reading, SensorPrediction } from '@sensorhub/shared';
import { DevicesService } from '../devices/devices.service';
import { ReadingsService } from '../readings/readings.service';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

describe('PredictionsController (HTTP Smoke Test)', () => {
  let app: INestApplication;
  let serverUrl: string;

  const mockDevicesService = {
    findOne: jest.fn(async (id: string) => {
      if (id === 'dev-001') {
        return {
          id: 'dev-001',
          name: 'Device 001',
          type: 'temp-sensor',
          battery: 95,
          firstSeen: '2026-01-01T00:00:00Z',
          lastSeen: '2026-01-01T00:30:00Z',
          status: 'online',
        };
      }
      throw new NotFoundException(`Device ${id} not found`);
    }),
  };

  const mockReadingsService = {
    findForDevice: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PredictionsController],
      providers: [
        PredictionsService,
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: ReadingsService, useValue: mockReadingsService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.listen(0);

    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? address : address.port;
    serverUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves real HTTP GET /api/devices/:id/predictions with linear regression', async () => {
    const t0 = new Date('2026-01-01T00:00:00.000Z');
    const t1 = new Date('2026-01-01T00:01:00.000Z'); // +1 min
    const readings: Reading[] = [
      {
        id: 'r1',
        deviceId: 'dev-001',
        temperature: 20.0,
        humidity: 50,
        battery: 90,
        recordedAt: t0.toISOString(),
      },
      {
        id: 'r2',
        deviceId: 'dev-001',
        temperature: 21.0,
        humidity: 50,
        battery: 90,
        recordedAt: t1.toISOString(),
      },
    ];
    mockReadingsService.findForDevice.mockResolvedValueOnce(readings);

    const res = await fetch(`${serverUrl}/api/devices/dev-001/predictions`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as SensorPrediction;
    expect(body.deviceId).toBe('dev-001');
    expect(body.sensorType).toBe('temperature');
    expect(body.status).toBe('ready');
    expect(body.sampleCount).toBe(2);
    expect(body.slopePerMinute).toBe(1); // 1.0 °C / min
    expect(body.baseTemperature).toBe(20.0);
    expect(body.predictions).toHaveLength(3);

    // +1 min (t1 + 1 min) -> 22.0 °C
    expect(body.predictions[0].horizonMinutes).toBe(1);
    expect(body.predictions[0].predictedTemperature).toBe(22.0);

    // +5 min (t1 + 5 min) -> 26.0 °C
    expect(body.predictions[1].horizonMinutes).toBe(5);
    expect(body.predictions[1].predictedTemperature).toBe(26.0);

    // +10 min (t1 + 10 min) -> 31.0 °C
    expect(body.predictions[2].horizonMinutes).toBe(10);
    expect(body.predictions[2].predictedTemperature).toBe(31.0);
  });

  it('serves real HTTP GET with insufficient data fallback when <2 readings', async () => {
    mockReadingsService.findForDevice.mockResolvedValueOnce([
      {
        id: 'r1',
        deviceId: 'dev-001',
        temperature: 22.5,
        humidity: 45,
        battery: 88,
        recordedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const res = await fetch(`${serverUrl}/api/devices/dev-001/predictions`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as SensorPrediction;
    expect(body.status).toBe('insufficient_data');
    expect(body.predictions).toEqual([]);
    expect(body.slopePerMinute).toBe(0);
    expect(body.sampleCount).toBe(1);
  });

  it('returns HTTP 404 for unknown device', async () => {
    const res = await fetch(`${serverUrl}/api/devices/dev-999/predictions`);
    expect(res.status).toBe(404);
  });
});
