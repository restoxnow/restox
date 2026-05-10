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

// POST /api/admin/access-codes/revoke
// Body: { code_id: string }
// Immediately reverts the redeemed user's plan to free if they still have focus group access.
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()

  // Verify admin status
  const { data: profile } = await admin
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { code_id } = body
  if (!code_id) return NextResponse.json({ error: 'code_id is required' }, { status: 400 })

  // Fetch the code to find redeemed_by
  const { data: code } = await admin
    .from('access_codes')
    .select('id, redeemed_by, revoked_at')
    .eq('id', code_id)
    .single()

  if (!code) return NextResponse.json({ error: 'Code not found' }, { status: 404 })
  if (code.revoked_at) return NextResponse.json({ error: 'Already revoked' }, { status: 409 })

  // Revoke the code
  const { error: revokeError } = await admin
    .from('access_codes')
    .update({ revoked_at: new Date().toISOString(), revoked_by: user.id })
    .eq('id', code_id)

  if (revokeError) return NextResponse.json({ error: revokeError.message }, { status: 500 })

  // If the code was redeemed, immediately revert the user's plan
  if (code.redeemed_by) {
    await admin
      .from('users')
      .update({ plan_tier: 'free', focus_group_access_expires_at: null })
      .eq('id', code.redeemed_by)
      .eq('plan_tier', 'professional') // only revert if still on professional via focus group
  }

  return NextResponse.json({ ok: true })
}
