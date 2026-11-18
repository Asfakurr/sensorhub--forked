import { Injectable } from '@nestjs/common';
import type { StreamEvent } from '@sensorhub/shared';
import { Observable, Subject, interval, map, merge } from 'rxjs';

/** In-process event bus. Anything published here goes out on GET /api/stream. */
@Injectable()
export class StreamService {
  private readonly events = new Subject<StreamEvent>();

  publish(event: StreamEvent): void {
    this.events.next(event);
  }

  /** Raw events, for other modules that want to react (e.g. alert rules). */
  get events$(): Observable<StreamEvent> {
    return this.events.asObservable();
  }

  /** Events plus a heartbeat every 15 s so proxies keep the connection open. */
  sse$(heartbeatMs = 15_000): Observable<{ data: StreamEvent }> {
    const pings = interval(heartbeatMs).pipe(
      map((): StreamEvent => ({ type: 'ping', data: { at: new Date().toISOString() } })),
    );
    return merge(this.events$, pings).pipe(map((event) => ({ data: event })));
  }
}
