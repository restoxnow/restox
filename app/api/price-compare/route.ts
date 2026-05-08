import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { product_id } = body
  if (!product_id) return NextResponse.json({ error: 'Missing product_id' }, { status: 400 })

  // Fetch connected retailers for this user
  const { data: retailers } = await supabase
    .from('retailers')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('connection_status', 'connected')

  if (!retailers || retailers.length === 0) {
    return NextResponse.json({ comparisons: [] })
  }

  // Generate mock prices with ±10% variation around a base price
  const basePrice = Math.round((Math.random() * 40 + 10) * 100) / 100 // $10–$50
  const now = new Date().toISOString()
  const comparisons = retailers.map(r => ({
    product_id,
    user_id: user.id,
    retailer_id: r.id,
    retailer_name: r.name,
    price: Math.round((basePrice * (0.9 + Math.random() * 0.2)) * 100) / 100,
    checked_at: now,
  }))

  // Replace any existing comparisons for this product
  await supabase
    .from('price_comparisons')
    .delete()
    .eq('product_id', product_id)
    .eq('user_id', user.id)

  const { data, error } = await supabase
    .from('price_comparisons')
    .insert(comparisons)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comparisons: data })
}
