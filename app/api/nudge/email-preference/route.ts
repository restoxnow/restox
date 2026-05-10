import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST { subscribe: boolean } — toggle nudge email opt-in/out from within the app
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subscribe } = await req.json().catch(() => ({}))
  if (typeof subscribe !== 'boolean') {
    return NextResponse.json({ error: 'subscribe must be boolean' }, { status: 400 })
  }

  await adminClient()
    .from('users')
    .update({ nudge_email_unsubscribed: !subscribe })
    .eq('id', user.id)

  return NextResponse.json({ ok: true, nudgeEmailUnsubscribed: !subscribe })
}
