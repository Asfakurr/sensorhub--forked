import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Reading } from '@sensorhub/shared';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { DevicesService } from '../devices/devices.service';
import { StreamService } from '../stream/stream.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { QueryReadingsDto } from './dto/query-readings.dto';
import { ReadingEntity } from './reading.entity';

export function toReading(entity: ReadingEntity): Reading {
  return {
    id: entity.id,
    deviceId: entity.deviceId,
    temperature: entity.temperature,
    humidity: entity.humidity,
    battery: entity.battery,
    recordedAt: entity.recordedAt.toISOString(),
  };
}

@Injectable()
export class ReadingsService {
  constructor(
    @InjectRepository(ReadingEntity) private readonly readings: Repository<ReadingEntity>,
    private readonly devices: DevicesService,
    private readonly stream: StreamService,
  ) {}

  async create(dto: CreateReadingDto): Promise<Reading> {
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();
    await this.devices.touch({
      id: dto.deviceId,
      name: dto.deviceName,
      type: dto.deviceType,
      battery: dto.battery,
      at: recordedAt,
    });
    const saved = await this.readings.save(
      this.readings.create({
        deviceId: dto.deviceId,
        temperature: dto.temperature,
        humidity: dto.humidity,
        battery: dto.battery,
        recordedAt,
      }),
    );
    const reading = toReading(saved);
    this.stream.publish({ type: 'reading', data: reading });
    return reading;
  }

  /** Newest first. Defaults to the last 100 readings. */
  async findRecent(query: QueryReadingsDto): Promise<Reading[]> {
    const rows = await this.readings.find({
      where: {
        ...(query.deviceId ? { deviceId: query.deviceId } : {}),
        ...(query.since ? { recordedAt: MoreThanOrEqual(new Date(query.since)) } : {}),
      },
      order: { recordedAt: 'DESC' },
      take: query.limit ?? 100,
    });
    return rows.map(toReading);
  }
}
