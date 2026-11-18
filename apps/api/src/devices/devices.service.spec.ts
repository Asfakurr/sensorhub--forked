import { NotFoundException } from '@nestjs/common';
import { DeviceEntity } from './device.entity';
import { DevicesService } from './devices.service';

describe('DevicesService', () => {
  const repo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((x: Partial<DeviceEntity>) => x),
    save: jest.fn(async (x: Partial<DeviceEntity>) => x),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new DevicesService(repo as any);

  beforeEach(() => jest.clearAllMocks());

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

  it('throws 404 for an unknown device', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
