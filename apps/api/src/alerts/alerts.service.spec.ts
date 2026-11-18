import type { Reading, StreamEvent } from '@sensorhub/shared';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StreamService } from '../stream/stream.service';
import { AlertEntity } from './alert.entity';
import { ALERT_COOLDOWN_MS, AlertsService } from './alerts.service';

const reading = (temperature: number, deviceId = 'dev-001'): Reading => ({
  id: 'r',
  deviceId,
  temperature,
  humidity: 40,
  battery: 80,
  recordedAt: '2026-01-01T00:00:00.000Z',
});

describe('AlertsService', () => {
  const repo = {
    create: jest.fn((x: Partial<AlertEntity>) => x),
    save: jest.fn(async (x: Partial<AlertEntity>) => ({
      id: 'a-1',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      ...x,
    })),
    find: jest.fn(),
  };
  let service: AlertsService;
  let stream: StreamService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AlertsService,
        StreamService,
        { provide: getRepositoryToken(AlertEntity), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(AlertsService);
    stream = moduleRef.get(StreamService);
  });

  it('ignores readings at or below the threshold', async () => {
    expect(await service.evaluate(reading(service.thresholdC))).toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('raises and publishes an alert above the threshold', async () => {
    const events: StreamEvent[] = [];
    stream.events$.subscribe((e) => events.push(e));

    const alert = await service.evaluate(reading(41.2));

    expect(alert).toMatchObject({ deviceId: 'dev-001', kind: 'temperature_high', value: 41.2 });
    expect(alert?.message).toContain('41.2');
    expect(events).toEqual([{ type: 'alert', data: alert }]);
  });

  it('raises at most one alert per device per cooldown window', async () => {
    const t0 = 1_000_000;
    expect(await service.evaluate(reading(40), t0)).not.toBeNull();
    expect(await service.evaluate(reading(42), t0 + 1_000)).toBeNull();
    expect(await service.evaluate(reading(42, 'dev-002'), t0 + 1_000)).not.toBeNull();
    expect(await service.evaluate(reading(42), t0 + ALERT_COOLDOWN_MS)).not.toBeNull();
    expect(repo.save).toHaveBeenCalledTimes(3);
  });

  it('evaluates readings published on the stream', async () => {
    service.onModuleInit();
    stream.publish({ type: 'reading', data: reading(50) });
    await new Promise((r) => setImmediate(r));
    expect(repo.save).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
  });
});
