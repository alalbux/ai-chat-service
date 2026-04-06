import '../tracer';
import { Logger } from '@nestjs/common';

const logger = new Logger('SchedulerProcess');

let running = true;
const timer = setInterval(() => {
  if (!running) {
    return;
  }
  logger.log('scheduler heartbeat');
}, 60_000);

function shutdown(signal: NodeJS.Signals) {
  running = false;
  clearInterval(timer);
  logger.log(`scheduler shutting down (${signal})`);
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

logger.log('scheduler process started');
