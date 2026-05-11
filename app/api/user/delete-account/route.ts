import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

// Admin client bypasses RLS for hard deletes
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send'
const FROM_EMAIL   = 'hello@restox.net'
const BASE_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://restox.net'

async function logError(opts: {
  userId: string | null
  eventType: string
  errorMessage: string
  metadata?: Record<string, unknown>
}) {
  try {
    await adminSupabase.from('error_logs').insert({
      user_id:       opts.userId,
      event_type:    opts.eventType,
      error_message: opts.errorMessage,
      metadata:      opts.metadata ?? null,
    })
  } catch { /* logging must never block the main flow */ }
}

async function sendSlackAlert(message: string) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
  } catch { /* non-fatal */ }
}

async function sendDeletionConfirmationEmail(email: string) {
  if (!process.env.SENDGRID_API_KEY) return
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
    <img src="https://restox.net/restox-logo-icon.png" alt="Restox" width="32" style="border-radius:8px;margin-bottom:24px"/>
    <h2 style="color:#1A1A2E;font-size:20px;margin:0 0 12px">Your Restox account has been deleted</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px">
      Your account and all associated data have been permanently removed from Restox. Any active subscription has been cancelled.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px">
      If you change your mind, you can always create a new account at <a href="${BASE_URL}" style="color:#F47C20">${BASE_URL}</a>.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0">
      Questions? Reach us at <a href="mailto:support@restox.net" style="color:#F47C20">support@restox.net</a>.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
    <p style="color:#9ca3af;font-size:12px;margin:0">Restox LLC · Nevada, USA</p>
  </div>`

  try {
    await fetch(SENDGRID_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: FROM_EMAIL, name: 'Restox' },
        subject: 'Your Restox account has been deleted',
        content: [{ type: 'text/html', value: html }],
      }),
    })
  } catch { /* non-fatal */ }
}

export async function DELETE() {
  // 1. Authenticate — must be the user themselves
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId    = user.id
  const userEmail = user.email ?? ''

  // 2. Fetch Stripe customer ID before we delete the row
  const { data: profile } = await adminSupabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? null

  // 3. Cancel active Stripe subscription
  if (customerId) {
    try {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 5 })
      await Promise.all(subs.data.map(sub => stripe.subscriptions.cancel(sub.id)))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Log the failure and alert ops — but always proceed with deletion
      await logError({
        userId,
        eventType: 'stripe_cancel_failed_on_deletion',
        errorMessage: msg,
        metadata: { stripe_customer_id: customerId },
      })
      await sendSlackAlert(
        `:warning: *Stripe cancellation failed during account deletion*\n` +
        `• User ID: \`${userId}\`\n` +
        `• Stripe customer: \`${customerId}\`\n` +
        `• Error: ${msg}\n` +
        `Manual cancellation required.`,
      )
    }
  }

  // 4. Delete all user data in dependency order
  const tables: Array<{ table: string; column?: string }> = [
    { table: 'price_comparisons',       column: 'user_id' },
    { table: 'order_history',           column: 'user_id' },
    { table: 'order_confirmations',     column: 'user_id' },
    { table: 'products',                column: 'user_id' },
    { table: 'purchase_schedules',      column: 'user_id' },
    { table: 'retailers',               column: 'user_id' },
    { table: 'retailer_payment_methods', column: 'user_id' },
    { table: 'plaid_connections',       column: 'user_id' },
    { table: 'ai_timing',               column: 'user_id' },
    { table: 'feedback',                column: 'user_id' },
    { table: 'users',                   column: 'id' },
  ]

  for (const { table, column = 'user_id' } of tables) {
    try {
      await adminSupabase.from(table).delete().eq(column, userId)
    } catch { /* non-fatal — continue cleanup */ }
  }

  // 5. Send confirmation email (always, regardless of Stripe outcome)
  await sendDeletionConfirmationEmail(userEmail)

  // 6. Delete the Supabase Auth user (must be last)
  try {
    await adminSupabase.auth.admin.deleteUser(userId)
  } catch (err) {
    console.error('Failed to delete auth user:', err)
    return NextResponse.json({ error: 'Account data deleted but auth removal failed. Contact support.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
