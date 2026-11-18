import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateReadingDto } from './dto/create-reading.dto';
import { QueryReadingsDto } from './dto/query-readings.dto';
import { ReadingsService } from './readings.service';

@Controller('readings')
export class ReadingsController {
  constructor(private readonly readings: ReadingsService) {}

  /** Devices (the simulator) post telemetry here. */
  @Post()
  create(@Body() dto: CreateReadingDto) {
    return this.readings.create(dto);
  }

  /** GET /api/readings?deviceId=dev-001&since=2026-01-01T00:00:00Z&limit=50 */
  @Get()
  findRecent(@Query() query: QueryReadingsDto) {
    return this.readings.findRecent(query);
  }
}
