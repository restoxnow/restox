import { NextRequest, NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { encrypt } from '@/lib/encrypt'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { public_token, institution_name } = await request.json()
    if (!public_token) {
      return NextResponse.json({ error: 'public_token is required' }, { status: 400 })
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = exchangeResponse.data

    // Encrypt access token before storing
    const encryptedToken = encrypt(access_token)

    // Upsert connection — one row per item_id per user
    const { error: dbError } = await supabase
      .from('plaid_connections')
      .upsert(
        {
          user_id: user.id,
          access_token: encryptedToken,
          item_id,
          institution_name: institution_name ?? null,
        },
        { onConflict: 'item_id' }
      )

    if (dbError) throw dbError

    return NextResponse.json({ success: true, institution_name })
  } catch (err: any) {
    console.error('Plaid exchange-token error:', err?.response?.data ?? err)
    return NextResponse.json(
      { error: 'Failed to exchange Plaid token' },
      { status: 500 }
    )
  }
}
