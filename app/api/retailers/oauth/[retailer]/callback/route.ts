/**
 * GET /api/retailers/oauth/[retailer]/callback
 *
 * Handles the OAuth 2.0 authorization callback from the retailer.
 *
 * Steps:
 *  1. Read + validate the state cookie (CSRF check, TTL, retailer match).
 *  2. Check for provider-sent errors (user denied, etc.).
 *  3. Verify the `state` query param matches the nonce in the cookie.
 *  4. Exchange the authorization code for tokens (using PKCE verifier).
 *  5. Encrypt tokens and upsert the retailers row via Supabase service role.
 *  6. Clear OAuth cookies and redirect to /dashboard/retailers?oauth=success.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  OAUTH_CONFIGS,
  exchangeCodeForToken,
  STATE_COOKIE,
  PKCE_COOKIE,
  COOKIE_PATH,
  type OAuthStateCookie,
} from '@/lib/retailer-oauth'
import { encrypt } from '@/lib/encrypt'

// Service-role Supabase client — bypasses RLS for trusted server-side writes.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: { retailer: string } }
) {
  const { retailer } = params
  const sp = req.nextUrl.searchParams

  const redirectTo = (query: string) =>
    NextResponse.redirect(new URL(`/dashboard/retailers?${query}`, req.url))

  const errorRedirect = (message: string) =>
    redirectTo(`oauth=error&message=${encodeURIComponent(message)}`)

  // ── 1. Validate OAuth config ──────────────────────────────────────────────
  const config = OAUTH_CONFIGS[retailer]
  if (!config) return errorRedirect('Unsupported retailer')

  // ── 2. Read + parse state cookie ──────────────────────────────────────────
  const rawState = req.cookies.get(STATE_COOKIE)?.value
  if (!rawState) return errorRedirect('OAuth session missing or expired — please try again')

  let stateCookie: OAuthStateCookie
  try {
    stateCookie = JSON.parse(rawState)
  } catch {
    return errorRedirect('Malformed OAuth state — please try again')
  }

  // TTL check (15 minutes)
  if (Date.now() - stateCookie.ts > 15 * 60 * 1000) {
    return errorRedirect('OAuth session expired — please try again')
  }

  // Retailer must match
  if (stateCookie.retailer !== retailer) {
    return errorRedirect('Retailer mismatch — please try again')
  }

  // ── 3. Check for provider errors (user denied, etc.) ─────────────────────
  const providerError = sp.get('error')
  if (providerError) {
    const desc = sp.get('error_description') ?? providerError
    return errorRedirect(desc)
  }

  // ── 4. CSRF: verify state nonce ───────────────────────────────────────────
  const stateParam = sp.get('state')
  if (!stateParam || stateParam !== stateCookie.nonce) {
    return errorRedirect('OAuth state mismatch — possible CSRF. Please try again.')
  }

  // ── 5. Get authorization code ─────────────────────────────────────────────
  const code = sp.get('code')
  if (!code) return errorRedirect('No authorization code received')

  // ── 6. Exchange code for tokens ───────────────────────────────────────────
  const codeVerifier = config.supportsPKCE
    ? req.cookies.get(PKCE_COOKIE)?.value
    : undefined

  const clientId     = process.env[config.clientIdEnv]     ?? ''
  const clientSecret = process.env[config.clientSecretEnv] ?? ''

  const base        = new URL(req.url)
  const redirectUri = `${base.protocol}//${base.host}/api/retailers/oauth/${retailer}/callback`

  let tokenData: Awaited<ReturnType<typeof exchangeCodeForToken>>
  try {
    tokenData = await exchangeCodeForToken(config, {
      code,
      redirectUri,
      codeVerifier,
      clientId,
      clientSecret,
    })
  } catch (err: any) {
    console.error(`[Restox] OAuth token exchange error (${retailer}):`, err.message)
    return errorRedirect('Failed to exchange authorization code — please try again')
  }

  // ── 7. Encrypt tokens + compute expiry ───────────────────────────────────
  const encryptedAccess  = encrypt(tokenData.access_token)
  const encryptedRefresh = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null
  const expiresAt        = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null

  // ── 8. Upsert retailer row ────────────────────────────────────────────────
  const { error: upsertError } = await adminClient()
    .from('retailers')
    .upsert(
      {
        user_id:           stateCookie.userId,
        name:              config.displayName,
        connection_type:   'oauth',
        connection_status: 'connected',
        access_token:      encryptedAccess,
        refresh_token:     encryptedRefresh,
        token_expires_at:  expiresAt,
        oauth_scope:       tokenData.scope ?? config.scopes.join(' '),
      },
      { onConflict: 'user_id,name' }
    )

  if (upsertError) {
    console.error(`[Restox] OAuth DB upsert error (${retailer}):`, upsertError)
    return errorRedirect('Failed to save connection — please try again')
  }

  // ── 9. Clear cookies + redirect to success ────────────────────────────────
  const isProduction = process.env.NODE_ENV === 'production'
  const clearOpts = {
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'lax' as const,
    path:     COOKIE_PATH,
    maxAge:   0,
  }

  const response = redirectTo(
    `oauth=success&retailer=${encodeURIComponent(config.displayName)}`
  )
  response.cookies.set(STATE_COOKIE, '', clearOpts)
  response.cookies.set(PKCE_COOKIE,  '', clearOpts)

  return response
}
