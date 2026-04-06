import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { JsonLogger } from './json-logger.service';

@Global()
@Module({
  providers: [
    JsonLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
  exports: [JsonLogger],
})
export class ObservabilityModule {}
