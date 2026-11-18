import type { StreamEvent } from '@sensorhub/shared';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DevicesService } from '../devices/devices.service';
import { StreamService } from '../stream/stream.service';
import { ReadingEntity } from './reading.entity';
import { ReadingsService } from './readings.service';

describe('ReadingsService', () => {
  const repo = {
    create: jest.fn((x: Partial<ReadingEntity>) => x),
    save: jest.fn(async (x: Partial<ReadingEntity>) => ({ id: 'r-1', ...x })),
    find: jest.fn(),
  };
  const devices = { touch: jest.fn() };
  let service: ReadingsService;
  let stream: StreamService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReadingsService,
        StreamService,
        { provide: getRepositoryToken(ReadingEntity), useValue: repo },
        { provide: DevicesService, useValue: devices },
      ],
    }).compile();
    service = moduleRef.get(ReadingsService);
    stream = moduleRef.get(StreamService);
  });

  it('saves a reading, touches the device and publishes it on the stream', async () => {
    const events: StreamEvent[] = [];
    stream.events$.subscribe((e) => events.push(e));

    const reading = await service.create({
      deviceId: 'dev-001',
      deviceName: 'Boiler room',
      temperature: 21.5,
      humidity: 40,
      battery: 88,
      recordedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(devices.touch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'dev-001', name: 'Boiler room', battery: 88 }),
    );
    expect(reading).toEqual({
      id: 'r-1',
      deviceId: 'dev-001',
      temperature: 21.5,
      humidity: 40,
      battery: 88,
      recordedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(events).toEqual([{ type: 'reading', data: reading }]);
  });

  it('defaults to the newest 100 readings', async () => {
    repo.find.mockResolvedValue([]);
    await service.findRecent({});
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { recordedAt: 'DESC' }, take: 100 }),
    );
  });
});
