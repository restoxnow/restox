import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyNudgeToken } from '@/lib/nudge-token'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const HTML_SUCCESS = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribed — Restox</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 16px; padding: 48px 40px; max-width: 440px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { color: #1A1A2E; font-size: 22px; margin: 0 0 12px; }
    p { color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; padding: 10px 24px; background: #F47C20; color: white; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; }
    .check { font-size: 40px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">✅</div>
    <h1>You're unsubscribed</h1>
    <p>You won't receive weekly upgrade insight emails from Restox anymore. You can re-enable them anytime in your account settings.</p>
    <a href="https://restox.net/dashboard/settings?tab=notifications">Go to Settings</a>
  </div>
</body>
</html>`

const HTML_INVALID = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invalid link — Restox</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 16px; padding: 48px 40px; max-width: 440px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { color: #1A1A2E; font-size: 22px; margin: 0 0 12px; }
    p { color: #6b7280; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Invalid or expired link</h1>
    <p>This unsubscribe link is not valid. Please use the link from your most recent Restox email, or manage your preferences in your account settings.</p>
  </div>
</body>
</html>`

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return new NextResponse(HTML_INVALID, { status: 400, headers: { 'Content-Type': 'text/html' } })
  }

  const userId = verifyNudgeToken(token)
  if (!userId) {
    return new NextResponse(HTML_INVALID, { status: 400, headers: { 'Content-Type': 'text/html' } })
  }

  await adminClient()
    .from('users')
    .update({ nudge_email_unsubscribed: true })
    .eq('id', userId)

  return new NextResponse(HTML_SUCCESS, { status: 200, headers: { 'Content-Type': 'text/html' } })
}
