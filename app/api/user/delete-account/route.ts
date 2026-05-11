import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

// Admin client bypasses RLS for hard deletes
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function DELETE() {
  // 1. Authenticate — must be the user themselves
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id

  // 2. Fetch Stripe customer ID before we delete the row
  const { data: profile } = await adminSupabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? null

  // 3. Cancel active Stripe subscription (non-fatal)
  if (customerId) {
    try {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 5 })
      await Promise.all(subs.data.map(sub => stripe.subscriptions.cancel(sub.id)))
    } catch { /* non-fatal — proceed with deletion */ }
  }

  // 4. Delete all user data in dependency order
  // Children first, then parent tables, then auth user
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

  // 5. Delete the Supabase Auth user (must be last)
  try {
    await adminSupabase.auth.admin.deleteUser(userId)
  } catch (err) {
    // If auth deletion fails, the DB data is already gone — log and continue
    console.error('Failed to delete auth user:', err)
    return NextResponse.json({ error: 'Account data deleted but auth removal failed. Contact support.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
