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

// ---------------------------------------------------------------------------
// PATCH /api/retailers/payment-methods/select
// Sets selected_for_auto_order = true for one method, false for all others
// in that retailer for this user.
// Body: { retailer_name: string, payment_method_id: string | null }
//   payment_method_id null = clear selection (confirmation-required mode)
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { retailer_name, payment_method_id } = body

  if (!retailer_name) {
    return NextResponse.json({ error: 'Missing retailer_name' }, { status: 400 })
  }

  const admin = adminClient()

  // Clear all selections for this user + retailer
  const { error: clearError } = await admin
    .from('retailer_payment_methods')
    .update({ selected_for_auto_order: false })
    .eq('user_id', user.id)
    .eq('retailer_name', retailer_name)

  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 })
  }

  // Set the chosen method (if one was provided)
  if (payment_method_id) {
    const { error: selectError } = await admin
      .from('retailer_payment_methods')
      .update({ selected_for_auto_order: true })
      .eq('user_id', user.id)
      .eq('retailer_name', retailer_name)
      .eq('payment_method_id', payment_method_id)

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
