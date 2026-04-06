import '../tracer';
import { Logger } from '@nestjs/common';

const logger = new Logger('WorkerProcess');

let running = true;
const timer = setInterval(() => {
  if (!running) {
    return;
  }
  logger.log('worker heartbeat');
}, 30_000);

function shutdown(signal: NodeJS.Signals) {
  running = false;
  clearInterval(timer);
  logger.log(`worker shutting down (${signal})`);
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

logger.log('worker process started');
