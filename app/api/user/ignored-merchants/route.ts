import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('ignored_merchants')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json({ ignored_merchants: data?.ignored_merchants ?? [] })
  } catch (err: any) {
    console.error('GET ignored-merchants error:', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { merchants } = await request.json()
    if (!Array.isArray(merchants)) {
      return NextResponse.json({ error: 'merchants must be an array' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .upsert({ id: user.id, ignored_merchants: merchants }, { onConflict: 'id' })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('PATCH ignored-merchants error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
