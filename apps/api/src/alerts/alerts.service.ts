import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Alert, Reading } from '@sensorhub/shared';
import { Subscription, filter } from 'rxjs';
import { Repository } from 'typeorm';
import { StreamService } from '../stream/stream.service';
import { QueryAlertsDto } from './dto/query-alerts.dto';
import { AlertEntity } from './alert.entity';

/** At most one alert of the same kind per device in this window. */
export const ALERT_COOLDOWN_MS = 60_000;

export function toAlert(entity: AlertEntity): Alert {
  return {
    id: entity.id,
    deviceId: entity.deviceId,
    kind: entity.kind,
    message: entity.message,
    value: entity.value,
    createdAt: entity.createdAt.toISOString(),
  };
}

@Injectable()
export class AlertsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertsService.name);
  private readonly lastAlertAt = new Map<string, number>();
  private subscription?: Subscription;
  readonly thresholdC = Number(process.env.TEMP_ALERT_C ?? 35);

  constructor(
    @InjectRepository(AlertEntity) private readonly alerts: Repository<AlertEntity>,
    private readonly stream: StreamService,
  ) {}

  /** Watch every new reading on the stream; ReadingsService doesn't need to know we exist. */
  onModuleInit() {
    this.subscription = this.stream.events$
      .pipe(filter((e) => e.type === 'reading'))
      .subscribe((e) => {
        this.evaluate(e.data as Reading).catch((err) =>
          this.logger.error(`Alert rule failed: ${err}`),
        );
      });
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
  }

  /** Apply the alert rules to one reading. Returns the alert if one was raised. */
  async evaluate(reading: Reading, now = Date.now()): Promise<Alert | null> {
    if (reading.temperature <= this.thresholdC) return null;

    const key = `${reading.deviceId}:temperature_high`;
    const last = this.lastAlertAt.get(key);
    if (last !== undefined && now - last < ALERT_COOLDOWN_MS) return null;
    this.lastAlertAt.set(key, now);

    const saved = await this.alerts.save(
      this.alerts.create({
        deviceId: reading.deviceId,
        kind: 'temperature_high',
        value: reading.temperature,
        message: `${reading.deviceId} is at ${reading.temperature.toFixed(1)} °C (limit ${this.thresholdC} °C)`,
      }),
    );
    const alert = toAlert(saved);
    this.stream.publish({ type: 'alert', data: alert });
    return alert;
  }

  /** Newest first. Defaults to the last 20 alerts. */
  async findRecent(query: QueryAlertsDto): Promise<Alert[]> {
    const rows = await this.alerts.find({
      where: query.deviceId ? { deviceId: query.deviceId } : {},
      order: { createdAt: 'DESC' },
      take: query.limit ?? 20,
    });
    return rows.map(toAlert);
  }
}
