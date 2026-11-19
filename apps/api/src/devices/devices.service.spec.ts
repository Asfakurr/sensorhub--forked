import { NotFoundException } from '@nestjs/common';
import { DEVICE_OFFLINE_THRESHOLD_MS } from '@sensorhub/shared';
import type { Repository } from 'typeorm';
import { DeviceEntity } from './device.entity';
import { DevicesService, toDevice } from './devices.service';

describe('DevicesService', () => {
  const repo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((x: Partial<DeviceEntity>) => x),
    save: jest.fn(async (x: Partial<DeviceEntity>) => x),
  };
  const service = new DevicesService(repo as unknown as Repository<DeviceEntity>);

  const createMockEntity = (overrides: Partial<DeviceEntity> = {}): DeviceEntity => ({
    id: 'dev-001',
    name: 'Sensor 1',
    type: 'env-sensor',
    battery: 85,
    firstSeen: new Date('2026-01-01T00:00:00Z'),
    lastSeen: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  beforeEach(() => jest.clearAllMocks());

  describe('toDevice', () => {
    const fixedNow = 1_700_000_000_000;

    it('maps entity properties accurately', () => {
      const entity = createMockEntity({
        id: 'dev-100',
        name: 'Workshop',
        type: 'env-sensor',
        battery: 92,
        firstSeen: new Date('2026-01-01T10:00:00.000Z'),
        lastSeen: new Date(fixedNow - 3_000),
      });

      const mapped = toDevice(entity, fixedNow);
      expect(mapped).toEqual({
        id: 'dev-100',
        name: 'Workshop',
        type: 'env-sensor',
        battery: 92,
        firstSeen: '2026-01-01T10:00:00.000Z',
        lastSeen: new Date(fixedNow - 3_000).toISOString(),
        status: 'online',
      });
    });

    it('evaluates device seen 3 seconds ago as online', () => {
      const entity = createMockEntity({
        lastSeen: new Date(fixedNow - 3_000),
      });
      const result = toDevice(entity, fixedNow);
      expect(result.status).toBe('online');
    });

    it('evaluates device seen 15 seconds ago as offline', () => {
      const entity = createMockEntity({
        lastSeen: new Date(fixedNow - 15_000),
      });
      const result = toDevice(entity, fixedNow);
      expect(result.status).toBe('offline');
    });

    describe('boundary threshold condition', () => {
      it('evaluates device seen exactly at threshold as online', () => {
        const entity = createMockEntity({
          lastSeen: new Date(fixedNow - DEVICE_OFFLINE_THRESHOLD_MS),
        });
        const result = toDevice(entity, fixedNow);
        expect(result.status).toBe('online');
      });

      it('evaluates device seen just past threshold (threshold + 1ms) as offline', () => {
        const entity = createMockEntity({
          lastSeen: new Date(fixedNow - DEVICE_OFFLINE_THRESHOLD_MS - 1),
        });
        const result = toDevice(entity, fixedNow);
        expect(result.status).toBe('offline');
      });

      it('evaluates device seen just within threshold (threshold - 1ms) as online', () => {
        const entity = createMockEntity({
          lastSeen: new Date(fixedNow - DEVICE_OFFLINE_THRESHOLD_MS + 1),
        });
        const result = toDevice(entity, fixedNow);
        expect(result.status).toBe('online');
      });
    });
  });

  describe('findOne', () => {
    it('returns mapped device with status when found', async () => {
      const entity = createMockEntity({
        id: 'dev-001',
        lastSeen: new Date(Date.now() - 2_000),
      });
      repo.findOneBy.mockResolvedValue(entity);

      const device = await service.findOne('dev-001');
      expect(device).toMatchObject({
        id: 'dev-001',
        status: 'online',
      });
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'dev-001' });
    });

    it('throws 404 for an unknown device', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns mapped devices with status computed', async () => {
      const fixedNow = 1_700_000_000_000;
      const entities: DeviceEntity[] = [
        createMockEntity({
          id: 'dev-001',
          name: 'Device 1',
          lastSeen: new Date(fixedNow - 3_000),
        }),
        createMockEntity({
          id: 'dev-002',
          name: 'Device 2',
          lastSeen: new Date(fixedNow - 15_000),
        }),
      ];
      repo.find.mockResolvedValue(entities);

      const devices = await service.findAll(fixedNow);
      expect(repo.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
      expect(devices).toHaveLength(2);
      expect(devices[0]).toMatchObject({ id: 'dev-001', status: 'online' });
      expect(devices[1]).toMatchObject({ id: 'dev-002', status: 'offline' });
    });
  });

  describe('touch', () => {
    it('creates a device the first time it is seen', async () => {
      repo.findOneBy.mockResolvedValue(null);
      const at = new Date('2026-01-01T00:00:00Z');
      const device = await service.touch({ id: 'dev-002', battery: 90, at });
      expect(device).toMatchObject({ id: 'dev-002', name: 'dev-002', battery: 90, lastSeen: at });
    });

    it('refreshes lastSeen and battery for a known device', async () => {
      const existing = { id: 'dev-002', name: 'Lab', battery: 90, lastSeen: new Date(0) };
      repo.findOneBy.mockResolvedValue(existing);
      const at = new Date('2026-01-02T00:00:00Z');
      const device = await service.touch({ id: 'dev-002', name: 'ignored', battery: 70, at });
      expect(device).toMatchObject({ name: 'Lab', battery: 70, lastSeen: at });
    });
  });
});
