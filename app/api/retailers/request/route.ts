import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { notifyAdmin } from '@/lib/admin-notify'

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
  const { retailerName, websiteUrl, reason } = body

  if (!retailerName?.trim()) {
    return NextResponse.json({ error: 'Retailer name is required' }, { status: 400 })
  }

  const { error: dbError } = await adminClient().from('retailer_requests').insert({
    user_id:      user.id,
    retailer_name: retailerName.trim(),
    website_url:  websiteUrl?.trim() || null,
    reason:       reason?.trim() || null,
  })

  if (dbError) {
    console.error('[retailers/request] insert error:', dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Server-side notification — never cancelled by browser navigation
  notifyAdmin({
    type:         'retailer_request',
    userEmail:    user.email ?? '',
    retailerName: retailerName.trim(),
    websiteUrl:   websiteUrl?.trim() || null,
    reason:       reason?.trim() || null,
  }).catch(err => console.warn('[retailers/request] notify error:', err))

  return NextResponse.json({ ok: true })
}
