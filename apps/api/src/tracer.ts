import tracer from 'dd-trace';

tracer.init({
  logInjection: process.env.DD_LOGS_INJECTION === 'true',
});

export function getDatadogCorrelationIds(): { traceId?: string; spanId?: string } {
  const span = tracer.scope().active();
  if (!span) {
    return {};
  }
  const context = span.context();
  return {
    traceId: context.toTraceId(),
    spanId: context.toSpanId(),
  };
}

export default tracer;
