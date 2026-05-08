import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const user = data.user

      // New user: account was created within the last 2 minutes
      const createdMs = new Date(user.created_at).getTime()
      const isNewUser = Date.now() - createdMs < 2 * 60 * 1000

      if (isNewUser) {
        return NextResponse.redirect(
          `${origin}/dashboard/settings?tab=profile&welcome=true`
        )
      }

      // Returning user: check if profile fields are set
      const hasFullName = !!user.user_metadata?.full_name
      if (!hasFullName) {
        return NextResponse.redirect(
          `${origin}/dashboard/settings?tab=profile`
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Exchange failed — send to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
