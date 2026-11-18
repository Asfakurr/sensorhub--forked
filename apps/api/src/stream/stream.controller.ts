import { Controller, Header, Sse } from '@nestjs/common';
import { StreamService } from './stream.service';

@Controller('stream')
export class StreamController {
  constructor(private readonly stream: StreamService) {}

  /** Server-sent events: live readings (and later alerts) for the dashboard. */
  @Sse()
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('X-Accel-Buffering', 'no')
  events() {
    return this.stream.sse$();
  }
}
