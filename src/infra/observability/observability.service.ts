import { Injectable } from '@nestjs/common';
import * as sentry from '@sentry/node';

@Injectable()
export class ObservabilityService {
  logger = sentry.logger;

  log(className: string, message: string) {
    this.logger.info(`[LOG - ${className}]: ${message}`);
  }

  error(className: string, message: string, trace: string | Error) {
    const traceString = trace instanceof Error ? trace.stack || trace.message : trace;
    this.logger.error(`[ERROR - ${className}]: ${message}`, { trace: traceString });
    
    if (trace && trace instanceof Error) {
      sentry.captureException(trace);
    } else if (typeof trace === 'string' && trace.trim().length > 0) {
      sentry.captureException(new Error(trace));
    } else {
      sentry.captureException(new Error(message));
    }
  }

  warn(className: string, message: string) {
    this.logger.warn(`[WARN - ${className}]: ${message}`);
  }
}
