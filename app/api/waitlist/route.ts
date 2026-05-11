import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyAdmin } from '@/lib/admin-notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, user_type } = body

    if (!name || !email || !user_type) {
      return NextResponse.json(
        { error: 'Name, email, and user type are required.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (!['consumer', 'business'].includes(user_type)) {
      return NextResponse.json({ error: 'Invalid user type.' }, { status: 400 })
    }

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'duplicate', message: 'You\'re already on the waitlist!' },
        { status: 409 }
      )
    }

    const { error } = await supabase.from('waitlist').insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      user_type,
    })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      )
    }

    notifyAdmin({
      type: 'waitlist_signup',
      email: email.toLowerCase().trim(),
      name: name.trim(),
      userType: user_type,
    }).catch(err => console.warn('[waitlist] notify error:', err))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Waitlist API error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return NextResponse.json({ count: count ?? 0 })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
