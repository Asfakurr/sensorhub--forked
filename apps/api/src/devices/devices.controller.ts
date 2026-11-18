import { Controller, Get, Param } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  findAll() {
    return this.devices.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devices.findOne(id);
  }
}
