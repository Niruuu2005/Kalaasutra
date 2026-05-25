// sentry.client.config.ts
// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === 'production';
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
const tracesRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? (isProd ? '0.2' : '0.01'));
const replaysRate = Number(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? (isProd ? '0.1' : '0.01'));
const replaysOnErrorRate = Number(process.env.SENTRY_REPLAYS_ONERROR_SAMPLE_RATE ?? (isProd ? '1.0' : '0.2'));

Sentry.init({
  // Enable only in production and when a DSN is configured. Defaults to very low sampling in dev.
  enabled: !!dsn && isProd,
  dsn: dsn || undefined,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Tracing sample rate (very low in dev to avoid throttling)
  tracesSampleRate: tracesRate,

  // Replay sampling
  replaysSessionSampleRate: replaysRate,
  replaysOnErrorSampleRate: replaysOnErrorRate,

  debug: process.env.SENTRY_DEBUG === 'true' || false,
});
