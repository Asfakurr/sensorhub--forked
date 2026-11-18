import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from './device.entity';

export interface DeviceSeen {
  id: string;
  name?: string;
  type?: string;
  battery: number;
  at: Date;
}

@Injectable()
export class DevicesService {
  constructor(@InjectRepository(DeviceEntity) private readonly devices: Repository<DeviceEntity>) {}

  findAll(): Promise<DeviceEntity[]> {
    return this.devices.find({ order: { id: 'ASC' } });
  }

  async findOne(id: string): Promise<DeviceEntity> {
    const device = await this.devices.findOneBy({ id });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
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
