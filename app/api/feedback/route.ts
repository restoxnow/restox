import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/log-error'
import { notifyAdmin } from '@/lib/admin-notify'

const CATEGORIES = ['Bug Report', 'Broken Link', 'Feature Request', 'Other'] as const

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
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
    const userId    = user?.id ?? null
    const userEmail = user?.email ?? String(body.email ?? '')

    // Insert into feedback table via service role
    const { error: insertError } = await adminClient().from('feedback').insert({
      user_id:   userId,
      user_email: userEmail,
      category,
      message:   String(message).trim(),
      page_url:  page_url ?? null,
    })

    if (insertError) throw insertError

    // Fire-and-forget admin notification (Slack + email for all categories)
    notifyAdmin({
      type:      'feedback',
      userEmail,
      category,
      message:   String(message).trim(),
      pageUrl:   page_url ?? null,
    }).catch(err => console.warn('[feedback] notify error:', err))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    Sentry.captureException(err)
    await logError({ route: '/api/feedback', error: err })
    console.error('[feedback] error:', err)
    return NextResponse.json({ error: err.message ?? 'Submission failed' }, { status: 500 })
  }
}
