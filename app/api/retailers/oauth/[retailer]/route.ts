/**
 * GET /api/retailers/oauth/[retailer]
 *
 * Initiates the OAuth 2.0 flow for a retailer.
 *
 * Steps:
 *  1. Verify the current Supabase session (user must be logged in).
 *  2. Look up the OAuth config for the given retailer slug.
 *  3. Check that client credentials are configured in env vars.
 *  4. Generate a PKCE code_verifier + code_challenge (S256).
 *  5. Generate a random state nonce.
 *  6. Store state + PKCE in httpOnly cookies (15-min TTL).
 *  7. Redirect the browser to the retailer's authorization URL.
 *
 * Callback URL: /api/retailers/oauth/[retailer]/callback
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import {
  OAUTH_CONFIGS,
  buildAuthUrl,
  generatePKCE,
  generateStateNonce,
  STATE_COOKIE,
  PKCE_COOKIE,
  COOKIE_PATH,
  COOKIE_TTL,
  type OAuthStateCookie,
} from '@/lib/retailer-oauth'

export async function GET(
  req: NextRequest,
  { params }: { params: { retailer: string } }
) {
  const { retailer } = params

  const errorRedirect = (message: string) =>
    NextResponse.redirect(
      new URL(`/dashboard/retailers?oauth=error&message=${encodeURIComponent(message)}`, req.url)
    )

  // ── 1. Verify OAuth config exists ─────────────────────────────────────────
  const config = OAUTH_CONFIGS[retailer]
  if (!config) return errorRedirect('Unsupported retailer')

  // ── 2. Verify user session ────────────────────────────────────────────────
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // ── 3. Verify env vars are populated ─────────────────────────────────────
  const clientId     = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]
  if (!clientId || !clientSecret) {
    return errorRedirect(
      `${config.displayName} OAuth credentials are not configured. ` +
      `Set ${config.clientIdEnv} and ${config.clientSecretEnv} in your environment.`
    )
  }

  // ── 4. Generate PKCE + state ──────────────────────────────────────────────
  const { verifier, challenge } = generatePKCE()
  const nonce = generateStateNonce()

  const stateCookie: OAuthStateCookie = {
    nonce,
    userId:   user.id,
    retailer,
    ts:       Date.now(),
  }

  // ── 5. Build redirect URI ─────────────────────────────────────────────────
  const base        = new URL(req.url)
  const redirectUri = `${base.protocol}//${base.host}/api/retailers/oauth/${retailer}/callback`

  // ── 6. Build authorization URL ────────────────────────────────────────────
  const authUrl = buildAuthUrl(config, {
    clientId,
    redirectUri,
    state:         nonce,
    codeChallenge: config.supportsPKCE ? challenge : undefined,
  })

  // ── 7. Set cookies and redirect ───────────────────────────────────────────
  const isProduction = process.env.NODE_ENV === 'production'

  const cookieOpts = {
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'lax' as const,
    path:     COOKIE_PATH,
    maxAge:   COOKIE_TTL,
  }

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(STATE_COOKIE, JSON.stringify(stateCookie), cookieOpts)
  if (config.supportsPKCE) {
    response.cookies.set(PKCE_COOKIE, verifier, cookieOpts)
  }

  return response
}
