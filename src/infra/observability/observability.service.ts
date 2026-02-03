import { Injectable } from '@nestjs/common';
import * as sentry from '@sentry/node';

@Injectable()
export class ObservabilityService {
  logger = sentry.logger;

  log(className: string, message: string) {
    this.logger.info(`[LOG - ${className}]: ${message}`);
  }

  error(className: string, message: string, trace: string) {
    this.logger.error(`[ERROR - ${className}]: ${message}`, { trace });
    sentry.captureException(trace);
  }

  warn(className: string, message: string) {
    this.logger.warn(`[WARN - ${className}]: ${message}`);
  }
}
