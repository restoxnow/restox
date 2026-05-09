/**
 * POST /api/retailers/oauth/[retailer]/refresh
 *
 * Exchanges a stored refresh_token for a new access_token and saves it.
 * Call this server-side before making retailer API requests when
 * retailers.token_expires_at is in the past.
 *
 * Auth: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OAUTH_CONFIGS, refreshAccessToken } from '@/lib/retailer-oauth'
import { encrypt, decrypt } from '@/lib/encrypt'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: { retailer: string } }
) {
  const { retailer } = params

  // ── Validate retailer ─────────────────────────────────────────────────────
  const config = OAUTH_CONFIGS[retailer]
  if (!config) {
    return NextResponse.json({ error: 'Unsupported retailer' }, { status: 400 })
  }

  // ── Authenticate caller ───────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )

  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // ── Fetch stored refresh token ────────────────────────────────────────────
  const { data: row, error: dbError } = await adminClient()
    .from('retailers')
    .select('refresh_token, token_expires_at')
    .eq('user_id', user.id)
    .eq('name', config.displayName)
    .maybeSingle()

  if (dbError || !row) {
    return NextResponse.json({ error: 'Retailer connection not found' }, { status: 404 })
  }

  if (!row.refresh_token) {
    return NextResponse.json({ error: 'No refresh token stored for this retailer' }, { status: 422 })
  }

  // Check whether a refresh is actually needed
  if (row.token_expires_at) {
    const expiresAt = new Date(row.token_expires_at).getTime()
    if (Date.now() < expiresAt - 60_000) {
      // Token still valid for more than 1 minute — no refresh needed
      return NextResponse.json({ refreshed: false })
    }
  }

  // ── Decrypt refresh token ─────────────────────────────────────────────────
  let decryptedRefresh: string
  try {
    decryptedRefresh = decrypt(row.refresh_token)
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt refresh token' }, { status: 500 })
  }

  const clientId     = process.env[config.clientIdEnv]     ?? ''
  const clientSecret = process.env[config.clientSecretEnv] ?? ''

  // ── Perform token refresh ─────────────────────────────────────────────────
  let tokenData: Awaited<ReturnType<typeof refreshAccessToken>>
  try {
    tokenData = await refreshAccessToken(config, {
      refreshToken:  decryptedRefresh,
      clientId,
      clientSecret,
    })
  } catch (err: any) {
    console.error(`[Restox] Token refresh error (${retailer}):`, err.message)
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 502 })
  }

  // ── Persist new tokens ────────────────────────────────────────────────────
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null

  const { error: updateError } = await adminClient()
    .from('retailers')
    .update({
      access_token:     encrypt(tokenData.access_token),
      // Some providers rotate the refresh token; keep old one if not rotated
      refresh_token:    tokenData.refresh_token
        ? encrypt(tokenData.refresh_token)
        : row.refresh_token,
      token_expires_at: expiresAt,
    })
    .eq('user_id', user.id)
    .eq('name', config.displayName)

  if (updateError) {
    console.error(`[Restox] Token refresh DB update error (${retailer}):`, updateError)
    return NextResponse.json({ error: 'Failed to persist refreshed token' }, { status: 500 })
  }

  return NextResponse.json({ refreshed: true })
}
