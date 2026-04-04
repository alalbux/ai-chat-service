import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider } from '@willsoto/nestjs-prometheus';

export const HTTP_REQUESTS_METRIC = 'http_requests_total';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    makeCounterProvider({
      name: HTTP_REQUESTS_METRIC,
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code'] as const,
    }),
  ],
  exports: [PrometheusModule],
})
export class MetricsModule {}
