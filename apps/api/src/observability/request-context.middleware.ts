import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { getDatadogCorrelationIds } from '../tracer';

type RequestWithContext = Request & {
  requestId?: string;
  traceId?: string;
  spanId?: string;
};

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: RequestWithContext, res: Response, next: NextFunction) {
    const requestIdHeader = req.header('x-request-id');
    const requestId = requestIdHeader && requestIdHeader.trim() ? requestIdHeader : randomUUID();
    const dd = getDatadogCorrelationIds();

    req.requestId = requestId;
    req.traceId = dd.traceId;
    req.spanId = dd.spanId;

    res.setHeader('x-request-id', requestId);
    if (dd.traceId) {
      res.setHeader('x-datadog-trace-id', dd.traceId);
    }
    next();
  }
}
