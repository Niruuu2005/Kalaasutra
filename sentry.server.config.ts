// sentry.server.config.ts
// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === 'production';
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
const tracesRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? (isProd ? '0.2' : '0.01'));

Sentry.init({
  enabled: !!dsn && isProd,
  dsn: dsn || undefined,
  tracesSampleRate: tracesRate,
  debug: process.env.SENTRY_DEBUG === 'true' || false,
});
