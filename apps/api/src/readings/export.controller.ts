import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DevicesService } from '../devices/devices.service';
import { readingsToCsv } from './csv';
import { ExportReadingsDto } from './dto/export-readings.dto';
import { ReadingsService } from './readings.service';

@Controller('devices')
export class ExportController {
  constructor(
    private readonly devices: DevicesService,
    private readonly readings: ReadingsService,
  ) {}

  /** GET /api/devices/dev-001/readings.csv?hours=24 */
  @Get(':id/readings.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @Param('id') id: string,
    @Query() query: ExportReadingsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const device = await this.devices.findOne(id); // 404 if unknown
    const hours = query.hours ?? 24;
    const readings = await this.readings.findForDevice(
      device.id,
      new Date(Date.now() - hours * 3_600_000),
    );
    res.setHeader('Content-Disposition', `attachment; filename="${device.id}-readings.csv"`);
    return readingsToCsv(readings);
  }
}
