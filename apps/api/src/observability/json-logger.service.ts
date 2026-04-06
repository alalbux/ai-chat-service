import { Injectable, LoggerService } from '@nestjs/common';
import { getDatadogCorrelationIds } from '../tracer';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class JsonLogger implements LoggerService {
  log(message: unknown, context?: string) {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context);
  }

  private write(level: LogLevel, message: unknown, context?: string, trace?: string) {
    const now = new Date().toISOString();
    const dd = getDatadogCorrelationIds();

    const payload: Record<string, unknown> = {
      timestamp: now,
      level,
      message: this.normalizeMessage(message),
      context: context ?? 'App',
      service: process.env.DD_SERVICE ?? 'rt-chat-api',
      env: process.env.DD_ENV ?? process.env.NODE_ENV ?? 'development',
      version: process.env.DD_VERSION ?? '0.0.1',
      trace_id: dd.traceId,
      span_id: dd.spanId,
    };

    if (trace) {
      payload.stack = trace;
    }

    const line = JSON.stringify(payload);
    if (level === 'error' || level === 'warn') {
      process.stderr.write(`${line}\n`);
      return;
    }
    process.stdout.write(`${line}\n`);
  }

  private normalizeMessage(message: unknown): string {
    if (message instanceof Error) {
      return `${message.name}: ${message.message}`;
    }
    if (typeof message === 'string') {
      return message;
    }
    return JSON.stringify(message);
  }
}
