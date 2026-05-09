import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      {
        status: 401,
        headers: corsHeaders(),
      }
    )
  }

  return NextResponse.json(
    {
      access_token: session.access_token,
      user: { id: session.user.id, email: session.user.email },
    },
    { headers: corsHeaders() }
  )
}

// OPTIONS preflight — extension makes cross-origin requests to restox.net
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
