# Restox — Error Monitoring & Alerting

## Sentry Setup

### 1. Create a Sentry project
1. Sign up at https://sentry.io (free tier is sufficient)
2. Create a new project → platform: **Next.js**
3. Copy the DSN and add it to `.env.local` and Vercel environment variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   ```
4. Get an auth token from Sentry → **Settings → Auth Tokens → Create Token**
   ```
   SENTRY_AUTH_TOKEN=...
   ```

### 2. Sentry email alerts
In Sentry → [Project] → **Alerts → Create Alert Rule**:
- Trigger: "A new issue is created"
- Action: Send email to `asevedge@restox.net`

### 3. Sentry Slack integration
1. In Sentry → **Settings → Integrations → Slack** → Install
2. Authorize the Restox Slack workspace
3. In your alert rule, add action: "Send Slack notification to #critical-alerts"

---

## Vercel Error Alerts (5xx)

1. Go to Vercel → [Project] → **Settings → Integrations**
2. Search for and install the **Sentry** Vercel integration — this automatically sets `SENTRY_AUTH_TOKEN` and `NEXT_PUBLIC_SENTRY_DSN` in Vercel environment variables from your Sentry project
3. For native Vercel 5xx alerts:
   - Go to Vercel → [Project] → **Observability → Alerts**
   - Create an alert for **Error Rate** threshold (e.g., >1% over 5 minutes)
   - Set notification channel to email or Slack

---

## SendGrid Email Setup

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Go to **Settings → API Keys → Create API Key** (Mail Send permission)
3. Add to `.env.local` and Vercel:
   ```
   SENDGRID_API_KEY=SG....
   ```
4. Verify the sender domain `restox.net` under **Settings → Sender Authentication**

---

## Slack Webhook (#critical-alerts)

Used for: Bug Reports submitted via the feedback modal, daily sync failures (n8n).

1. Go to https://api.slack.com/apps → Create App → From scratch
2. Enable **Incoming Webhooks** → Add New Webhook to Workspace → select #critical-alerts
3. Copy the webhook URL and add to `.env.local` and Vercel:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

---

## Environment Variables Summary

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | sentry.io → Project → Settings → Client Keys |
| `SENTRY_AUTH_TOKEN` | sentry.io → Settings → Auth Tokens |
| `SENDGRID_API_KEY` | sendgrid.com → Settings → API Keys |
| `SLACK_WEBHOOK_URL` | api.slack.com → Apps → Incoming Webhooks |

---

## Local error_logs table

Every critical API route logs errors to the `error_logs` Supabase table (via service role).
Query in the Supabase dashboard:

```sql
select route, error_message, created_at
from error_logs
order by created_at desc
limit 50;
```
