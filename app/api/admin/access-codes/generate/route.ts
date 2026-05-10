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

// Charset: uppercase alphanumeric excluding look-alike characters (0, O, 1, I, L)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return `RESTOX-BETA-${suffix}`
}

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
  const count = Math.min(Math.max(1, parseInt(body.count ?? '1', 10)), 100)
  const notes: string | null = body.notes ?? null
  const durationMonths: number = Math.max(1, parseInt(body.duration_months ?? '2', 10))

  // Generate unique codes (retry on collision)
  const codes: string[] = []
  const attempts = count * 5
  let i = 0
  while (codes.length < count && i < attempts) {
    i++
    const candidate = generateCode()
    if (!codes.includes(candidate)) codes.push(candidate)
  }

  const rows = codes.map(code => ({
    code,
    notes,
    duration_months: durationMonths,
    created_by: user.id,
  }))

  const { data, error } = await admin
    .from('access_codes')
    .insert(rows)
    .select('id, code, notes, duration_months, created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, codes: data })
}
