import { Controller, Get, Param } from '@nestjs/common';
import type { Device } from '@sensorhub/shared';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  findAll(): Promise<Device[]> {
    return this.devices.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Device> {
    return this.devices.findOne(id);
  }
}
