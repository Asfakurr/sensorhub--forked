import { Controller, Get, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { QueryAlertsDto } from './dto/query-alerts.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  /** GET /api/alerts?deviceId=dev-001&limit=20 */
  @Get()
  findRecent(@Query() query: QueryAlertsDto) {
    return this.alerts.findRecent(query);
  }
}
