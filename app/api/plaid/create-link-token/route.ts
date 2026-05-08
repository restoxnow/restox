import { NextResponse } from 'next/server'
import { Products, CountryCode } from 'plaid'
import { plaidClient } from '@/lib/plaid'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: 'Restox',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    })

    return NextResponse.json({ link_token: response.data.link_token })
  } catch (err: any) {
    console.error('Plaid create-link-token error:', err?.response?.data ?? err)
    return NextResponse.json(
      { error: 'Failed to create Plaid link token' },
      { status: 500 }
    )
  }
}
