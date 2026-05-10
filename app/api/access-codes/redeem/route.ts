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

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const code: string = (body.code ?? '').trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const admin = adminClient()

  // Look up the code
  const { data: accessCode } = await admin
    .from('access_codes')
    .select('id, duration_months, redeemed_by, redeemed_at, access_expires_at, revoked_at')
    .eq('code', code)
    .single()

  if (!accessCode) {
    return NextResponse.json({ error: 'Invalid code. Please check and try again.' }, { status: 404 })
  }

  if (accessCode.revoked_at) {
    return NextResponse.json({ error: 'This code has been revoked.' }, { status: 409 })
  }

  if (accessCode.redeemed_by) {
    if (accessCode.redeemed_by === user.id) {
      return NextResponse.json({ error: 'You have already redeemed this code.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'This code has already been used.' }, { status: 409 })
  }

  if (accessCode.access_expires_at && new Date(accessCode.access_expires_at) < new Date()) {
    return NextResponse.json({ error: 'This code has expired.' }, { status: 409 })
  }

  // Check if user has already redeemed any focus group code
  const { data: existingRedemption } = await admin
    .from('access_codes')
    .select('id')
    .eq('redeemed_by', user.id)
    .limit(1)
    .single()

  if (existingRedemption) {
    return NextResponse.json(
      { error: 'You have already redeemed a focus group code.' },
      { status: 409 }
    )
  }

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + accessCode.duration_months)

  // Mark the code as redeemed
  const { error: codeError } = await admin
    .from('access_codes')
    .update({
      redeemed_by: user.id,
      redeemed_at: now.toISOString(),
      access_expires_at: expiresAt.toISOString(),
    })
    .eq('id', accessCode.id)

  if (codeError) return NextResponse.json({ error: codeError.message }, { status: 500 })

  // Upgrade user to Pro
  const { error: userError } = await admin
    .from('users')
    .update({
      plan_tier: 'professional',
      focus_group_access_expires_at: expiresAt.toISOString(),
    })
    .eq('id', user.id)

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    access_expires_at: expiresAt.toISOString(),
    duration_months: accessCode.duration_months,
  })
}
