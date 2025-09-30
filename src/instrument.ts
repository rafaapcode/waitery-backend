import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://797c86925da90cc1d1b9d0baa6e8e3b6@o4508241868161024.ingest.us.sentry.io/4509417942417408',
  enableLogs: true,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});
