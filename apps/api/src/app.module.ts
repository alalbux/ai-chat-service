import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { HttpMetricsInterceptor } from './metrics/http-metrics.interceptor';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL_MS ?? 60_000),
          limit: Number(process.env.RATE_LIMIT_MAX ?? 100),
        },
      ],
      skipIf: (ctx) => {
        const req = ctx.switchToHttp().getRequest<{ url?: string }>();
        const url = req.url ?? '';
        return url.startsWith('/health') || url.startsWith('/metrics') || url.startsWith('/docs');
      },
    }),
    PrismaModule,
    MetricsModule,
    HealthModule,
    ChatModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
})
export class AppModule {}
