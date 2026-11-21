import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Device } from '@sensorhub/shared';
import { getDeviceStatus } from '@sensorhub/shared';
import { Repository } from 'typeorm';
import { DeviceEntity } from './device.entity';

export interface DeviceSeen {
  id: string;
  name?: string;
  type?: string;
  battery: number;
  at: Date;
}

function toIsoString(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return new Date(date).toISOString();
}

export function toDevice(entity: DeviceEntity, now?: number): Device {
  return {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    battery: entity.battery,
    firstSeen: toIsoString(entity.firstSeen),
    lastSeen: toIsoString(entity.lastSeen),
    status: getDeviceStatus(entity.lastSeen, now),
  };
}

@Injectable()
export class DevicesService {
  constructor(@InjectRepository(DeviceEntity) private readonly devices: Repository<DeviceEntity>) {}

  toDevice(entity: DeviceEntity, now?: number): Device {
    return toDevice(entity, now);
  }

  async findAll(now?: number): Promise<Device[]> {
    const list = await this.devices.find({ order: { id: 'ASC' } });
    return list.map((device) => this.toDevice(device, now));
  }

  async findOne(id: string, now?: number): Promise<Device> {
    const device = await this.devices.findOneBy({ id });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return this.toDevice(device, now);
  }

  /** Create the device on first contact, otherwise refresh lastSeen and battery. */
  async touch(seen: DeviceSeen): Promise<DeviceEntity> {
    const existing = await this.devices.findOneBy({ id: seen.id });
    if (existing) {
      existing.lastSeen = seen.at;
      existing.battery = seen.battery;
      return this.devices.save(existing);
    }
    return this.devices.save(
      this.devices.create({
        id: seen.id,
        name: seen.name ?? seen.id,
        type: seen.type ?? 'env-sensor',
        battery: seen.battery,
        lastSeen: seen.at,
      }),
    );
  }
}
