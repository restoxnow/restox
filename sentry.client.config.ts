/**
 * Sentry client-side configuration (browser).
 *
 * SETUP INSTRUCTIONS
 * ──────────────────
 * 1. Go to https://sentry.io and create a free account.
 * 2. Create a new project — platform: Next.js.
 * 3. Copy the DSN and add it as NEXT_PUBLIC_SENTRY_DSN in:
 *      - .env.local (local dev)
 *      - Vercel project settings → Environment Variables (production)
 * 4. In Sentry → [Project] → Alerts, create an alert rule:
 *      "When a new issue is seen → notify via email (asevedge@restox.net)"
 * 5. Optionally install the Sentry Slack integration and post to #critical-alerts.
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  environment: process.env.NODE_ENV,
})
