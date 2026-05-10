import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function logError(opts: {
  route: string
  error: unknown
  userId?: string | null
}) {
  const err = opts.error instanceof Error ? opts.error : new Error(String(opts.error))
  try {
    await adminClient().from('error_logs').insert({
      user_id: opts.userId ?? null,
      route: opts.route,
      error_message: err.message,
      stack_trace: err.stack ?? null,
    })
  } catch {
    // never let error logging itself crash the caller
  }
}
