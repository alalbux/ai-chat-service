import tracer from 'dd-trace';

tracer.init({
  logInjection: process.env.DD_LOGS_INJECTION === 'true',
});

export default tracer;
