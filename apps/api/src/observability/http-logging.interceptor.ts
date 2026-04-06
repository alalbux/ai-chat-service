import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

type RequestWithContext = {
  method?: string;
  originalUrl?: string;
  url?: string;
  requestId?: string;
  traceId?: string;
};

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startedAt = Date.now();
    const req = context.switchToHttp().getRequest<RequestWithContext>();
    const res = context.switchToHttp().getResponse<{ statusCode?: number }>();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAt;
          this.logger.log({
            event: 'http_request',
            method: req.method ?? 'UNKNOWN',
            path: req.originalUrl ?? req.url ?? '',
            statusCode: res.statusCode ?? 200,
            durationMs,
            requestId: req.requestId,
            traceId: req.traceId,
          });
        },
        error: (err: unknown) => {
          const durationMs = Date.now() - startedAt;
          const statusCode =
            typeof err === 'object' &&
            err &&
            'status' in err &&
            typeof (err as { status?: unknown }).status === 'number'
              ? ((err as { status: number }).status ?? 500)
              : 500;
          this.logger.error(
            {
              event: 'http_request_error',
              method: req.method ?? 'UNKNOWN',
              path: req.originalUrl ?? req.url ?? '',
              statusCode,
              durationMs,
              requestId: req.requestId,
              traceId: req.traceId,
            },
            err instanceof Error ? err.stack : undefined,
          );
        },
      }),
    );
  }
}
