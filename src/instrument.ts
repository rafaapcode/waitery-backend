import 'dotenv/config';

import * as Sentry from '@sentry/nestjs';
import { env } from './shared/config/env';

Sentry.init({
  dsn: env.SENTRY_DSN,
  enableLogs: true,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});
