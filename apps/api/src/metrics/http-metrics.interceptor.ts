import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { Observable, tap } from 'rxjs';
import { HTTP_REQUESTS_METRIC } from './metrics.constants';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric(HTTP_REQUESTS_METRIC)
    private readonly httpRequests: Counter<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ method?: string; route?: { path?: string } }>();
    const res = context.switchToHttp().getResponse<{ statusCode?: number }>();
    const method = req.method ?? 'UNKNOWN';
    const route = req.route?.path ?? 'unmatched';

    return next.handle().pipe(
      tap({
        finalize: () => {
          this.httpRequests.inc({
            method,
            route,
            status_code: String(res.statusCode ?? 500),
          });
        },
      }),
    );
  }
}
