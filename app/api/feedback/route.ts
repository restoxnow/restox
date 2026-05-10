import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/log-error'

const CATEGORIES = ['Bug Report', 'Broken Link', 'Feature Request', 'Other'] as const

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function sendEmail(opts: {
  category: string
  message: string
  pageUrl: string
  userEmail: string
  timestamp: string
}) {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) return

  const subject = `[Restox Feedback] ${opts.category} — ${opts.message.slice(0, 50)}`
  const body = [
    `Category: ${opts.category}`,
    `Message: ${opts.message}`,
    `Page URL: ${opts.pageUrl || '(not provided)'}`,
    `User email: ${opts.userEmail || 'anonymous'}`,
    `Timestamp: ${opts.timestamp}`,
  ].join('\n')

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: 'asevedge@restox.net' }] }],
      from: { email: 'noreply@restox.net', name: 'Restox Feedback' },
      subject,
      content: [{ type: 'text/plain', value: body }],
    }),
  })
}

async function postSlackAlert(opts: {
  category: string
  message: string
  pageUrl: string
  userEmail: string
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `:beetle: *New Bug Report — Restox*\n*From:* ${opts.userEmail || 'anonymous'}\n*Page:* ${opts.pageUrl || 'unknown'}\n*Message:* ${opts.message}`,
    }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { category, message, page_url } = body

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    if (!message || String(message).trim().length < 10) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 })
    }

    // Get logged-in user if available
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id ?? null
    const userEmail = user?.email ?? String(body.email ?? '')

    const timestamp = new Date().toISOString()

    // Insert into feedback table via service role
    const { error: insertError } = await adminClient().from('feedback').insert({
      user_id: userId,
      user_email: userEmail,
      category,
      message: String(message).trim(),
      page_url: page_url ?? null,
    })

    if (insertError) throw insertError

    // Send email (fire-and-forget on errors)
    sendEmail({ category, message: String(message).trim(), pageUrl: page_url ?? '', userEmail, timestamp })
      .catch(err => console.warn('[feedback] sendgrid error:', err.message))

    // Slack alert only for bug reports
    if (category === 'Bug Report') {
      postSlackAlert({ category, message: String(message).trim(), pageUrl: page_url ?? '', userEmail })
        .catch(err => console.warn('[feedback] slack error:', err.message))
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    Sentry.captureException(err)
    await logError({ route: '/api/feedback', error: err })
    console.error('[feedback] error:', err)
    return NextResponse.json({ error: err.message ?? 'Submission failed' }, { status: 500 })
  }
}
