/**
 * Retailer OAuth 2.0 — server-only utilities.
 *
 * Import this file only from API routes / server actions, never from client
 * components (it references Node.js `crypto`).
 *
 * Retailer notes
 * ──────────────
 * KROGER      Public developer program — apply at developer.kroger.com.
 *             Cart + profile scopes available after app approval.
 *
 * AMAZON      Login with Amazon (LWA) — register at developer.amazon.com/loginwithamazon.
 *             LWA grants identity/profile access only.  Full purchase automation
 *             requires Amazon's restricted Buyer API; implement assuming approval.
 *
 * WALMART     Walmart Developer Portal — apply at developer.walmart.com.
 *             Publicly documented as a marketplace-seller API; consumer purchase
 *             OAuth requires a Walmart partnership agreement.
 *
 * INSTACART   Instacart Platform API — enterprise partnership required.
 *             Contact https://www.instacart.com/business to apply.
 *
 * TARGET      No public consumer OAuth program.  Internal partner API only.
 *             Contact developer@target.com to inquire.
 *
 * ALBERTSONS  Corporate API program — requires Albertsons partnership agreement.
 *
 * STOP & SHOP Part of Ahold Delhaize; no public developer program.
 *             Requires Ahold Delhaize corporate partnership.
 *
 * WEGMANS     No public OAuth API.  Contact developer@wegmans.com.
 *
 * SEPHORA     Invite-only API program.  No public consumer OAuth.
 *
 * CHEWY       No public OAuth API.  Requires direct partnership.
 *
 * HOME DEPOT  developer.homedepot.com provides product-data APIs only.
 *             Purchase OAuth requires a separate Home Depot partnership.
 *
 * All flows are fully scaffolded and ready to activate once client credentials
 * are obtained.  Set the corresponding CLIENT_ID / CLIENT_SECRET env vars and
 * whitelist the callback URL with each provider.
 */

import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TokenAuthMethod = 'basic' | 'body'

export interface OAuthConfig {
  displayName: string
  /** OAuth 2.0 authorization endpoint */
  authUrl: string
  /** OAuth 2.0 token endpoint */
  tokenUrl: string
  scopes: string[]
  supportsPKCE: boolean
  /** How client credentials are sent during token exchange */
  tokenAuthMethod: TokenAuthMethod
  requiresApproval: boolean
  approvalUrl?: string
  approvalNote: string
  /** Extra query params appended to the authorization URL */
  extraAuthParams?: Record<string, string>
  /** Env var name for the client ID */
  clientIdEnv: string
  /** Env var name for the client secret */
  clientSecretEnv: string
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
}

// ---------------------------------------------------------------------------
// Retailer name ↔ URL slug mapping
// "name" must match the value stored in retailers.name (display name)
// ---------------------------------------------------------------------------

export const SLUG_TO_NAME: Record<string, string> = {
  amazon:      'Amazon',
  walmart:     'Walmart',
  target:      'Target',
  kroger:      'Kroger',
  instacart:   'Instacart',
  albertsons:  'Albertsons',
  stopandshop: 'Stop & Shop',
  wegmans:     'Wegmans',
  sephora:     'Sephora',
  chewy:       'Chewy',
  homedepot:   'Home Depot',
}

export const NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_NAME).map(([slug, name]) => [name, slug])
)

// ---------------------------------------------------------------------------
// OAuth configurations (one per supported retailer)
// ---------------------------------------------------------------------------

export const OAUTH_CONFIGS: Record<string, OAuthConfig> = {

  // ── Kroger ────────────────────────────────────────────────────────────────
  // Public developer program: https://developer.kroger.com
  // Register your app, request scopes `cart.basic:write` and `profile.compact`,
  // and whitelist the redirect URI.  Approval typically takes a few business days.
  kroger: {
    displayName:       'Kroger',
    authUrl:           'https://api-ce.kroger.com/v1/connect/oauth2/authorize',
    tokenUrl:          'https://api-ce.kroger.com/v1/connect/oauth2/token',
    scopes:            ['cart.basic:write'],
    supportsPKCE:      true,
    tokenAuthMethod:   'basic',
    requiresApproval:  true,
    approvalUrl:       'https://developer.kroger.com',
    approvalNote:      'Register at developer.kroger.com, request cart.basic:write scope, whitelist the callback URL.',
    clientIdEnv:       'KROGER_CLIENT_ID',
    clientSecretEnv:   'KROGER_CLIENT_SECRET',
  },

  // ── Amazon (Login with Amazon) ────────────────────────────────────────────
  // Register a security profile at https://developer.amazon.com/loginwithamazon
  // LWA provides identity/profile data.  To place orders, also apply for the
  // Amazon Buyer API (restricted — contact Amazon Selling Partner team).
  amazon: {
    displayName:       'Amazon',
    authUrl:           'https://www.amazon.com/ap/oa',
    tokenUrl:          'https://api.amazon.com/auth/o2/token',
    scopes:            ['profile'],
    supportsPKCE:      true,
    tokenAuthMethod:   'body',
    requiresApproval:  true,
    approvalUrl:       'https://developer.amazon.com/loginwithamazon',
    approvalNote:      'Register a Login with Amazon security profile. Purchase automation additionally requires the restricted Amazon Buyer API.',
    clientIdEnv:       'AMAZON_CLIENT_ID',
    clientSecretEnv:   'AMAZON_CLIENT_SECRET',
  },

  // ── Walmart ───────────────────────────────────────────────────────────────
  // Apply at https://developer.walmart.com
  // The public API targets marketplace sellers; consumer cart OAuth requires
  // a Walmart partnership agreement.  Verify exact auth/token URLs with Walmart
  // after partnership approval — these are reasonable defaults.
  walmart: {
    displayName:       'Walmart',
    authUrl:           'https://developer.walmart.com/api/oauth2/authorize',
    tokenUrl:          'https://marketplace.walmartapis.com/v3/token',
    scopes:            ['openid', 'profile', 'offline_access'],
    supportsPKCE:      true,
    tokenAuthMethod:   'basic',
    requiresApproval:  true,
    approvalUrl:       'https://developer.walmart.com',
    approvalNote:      'Consumer cart OAuth requires a Walmart partnership agreement. Verify OAuth endpoints with Walmart after approval.',
    clientIdEnv:       'WALMART_CLIENT_ID',
    clientSecretEnv:   'WALMART_CLIENT_SECRET',
  },

  // ── Instacart ─────────────────────────────────────────────────────────────
  // Instacart Platform API requires an enterprise partnership.
  // Apply at https://www.instacart.com/business
  // Endpoints below follow standard OAuth2; verify exact URLs from partner docs.
  instacart: {
    displayName:       'Instacart',
    authUrl:           'https://connect.instacart.com/oauth2/auth',
    tokenUrl:          'https://connect.instacart.com/oauth2/token',
    scopes:            ['openid', 'profile', 'email', 'orders.write'],
    supportsPKCE:      true,
    tokenAuthMethod:   'body',
    requiresApproval:  true,
    approvalUrl:       'https://www.instacart.com/business',
    approvalNote:      'Instacart Platform API is enterprise-only. Apply for partnership at instacart.com/business.',
    clientIdEnv:       'INSTACART_CLIENT_ID',
    clientSecretEnv:   'INSTACART_CLIENT_SECRET',
  },

  // ── Target ────────────────────────────────────────────────────────────────
  // No public consumer OAuth.  Internal Target Circle API requires partnership.
  // Contact developer@target.com to inquire.
  // All endpoints are placeholders — verify with Target after partnership approval.
  target: {
    displayName:       'Target',
    authUrl:           'https://oauth.target.com/oauth/authorize',
    tokenUrl:          'https://oauth.target.com/oauth/token',
    scopes:            ['openid', 'profile', 'email', 'offline_access'],
    supportsPKCE:      true,
    tokenAuthMethod:   'body',
    requiresApproval:  true,
    approvalUrl:       'https://developer.target.com',
    approvalNote:      'Target does not offer a public consumer OAuth program. Requires direct partnership (developer@target.com).',
    clientIdEnv:       'TARGET_CLIENT_ID',
    clientSecretEnv:   'TARGET_CLIENT_SECRET',
  },

  // ── Albertsons ────────────────────────────────────────────────────────────
  // Albertsons corporate API program — requires partnership agreement.
  // Endpoints follow observed API patterns; verify with Albertsons after approval.
  albertsons: {
    displayName:       'Albertsons',
    authUrl:           'https://api.albertsons.com/authorization/v3/authorize',
    tokenUrl:          'https://api.albertsons.com/authorization/v3/token',
    scopes:            ['openid', 'profile', 'email', 'offline_access'],
    supportsPKCE:      true,
    tokenAuthMethod:   'body',
    requiresApproval:  true,
    approvalNote:      'Requires an Albertsons corporate partnership agreement.',
    clientIdEnv:       'ALBERTSONS_CLIENT_ID',
    clientSecretEnv:   'ALBERTSONS_CLIENT_SECRET',
  },

  // ── Stop & Shop ───────────────────────────────────────────────────────────
  // Part of Ahold Delhaize.  No public developer program.
  // Requires corporate partnership with Ahold Delhaize.
  // Endpoints are placeholders — verify after partnership approval.
  stopandshop: {
    displayName:       'Stop & Shop',
    authUrl:           'https://api.stopandshop.com/oauth2/authorize',
    tokenUrl:          'https://api.stopandshop.com/oauth2/token',
    scopes:            ['openid', 'profile', 'email', 'cart:write', 'offline_access'],
    supportsPKCE:      true,
    tokenAuthMethod:   'body',
    requiresApproval:  true,
    approvalNote:      'Requires a corporate partnership with Ahold Delhaize (Stop & Shop parent company).',
    clientIdEnv:       'STOPANDSHOP_CLIENT_ID',
    clientSecretEnv:   'STOPANDSHOP_CLIENT_SECRET',
  },

  // ── Wegmans ───────────────────────────────────────────────────────────────
  // No public OAuth API.  Contact developer@wegmans.com to inquire.
  // Endpoints are placeholders — verify after partnership approval.
  wegmans: {
    displayName:       'Wegmans',
    authUrl:           'https://api.wegmans.com/oauth2/authorize',
    tokenUrl:          'https://api.wegmans.com/oauth2/token',
    scopes:            ['openid', 'profile', 'email', 'cart:write', 'offline_access'],
    supportsPKCE:      true,
    tokenAuthMethod:   'body',
    requiresApproval:  true,
    approvalNote:      'Wegmans has no public OAuth API. Contact developer@wegmans.com to inquire about partnership.',
    clientIdEnv:       'WEGMANS_CLIENT_ID',
    clientSecretEnv:   'WEGMANS_CLIENT_SECRET',
  },

  // ── Sephora ───────────────────────────────────────────────────────────────
  // Invite-only API program.  No public consumer OAuth for cart/purchasing.
  // Endpoints are placeholders — verify after partnership approval.
  sephora: {
    displayName:       'Sephora',
    authUrl:           'https://api.sephora.com/oauth2/authorize',
    tokenUrl:          'https://api.sephora.com/oauth2/token',
    scopes:            ['openid', 'profile', 'email', 'orders:write', 'offline_access'],
    supportsPKCE:      true,
    tokenAuthMethod:   'body',
    requiresApproval:  true,
    approvalNote:      'Sephora has an invite-only API program. Requires direct partnership with Sephora.',
    clientIdEnv:       'SEPHORA_CLIENT_ID',
    clientSecretEnv:   'SEPHORA_CLIENT_SECRET',
  },

  // ── Chewy ─────────────────────────────────────────────────────────────────
  // No public OAuth API for purchase automation.
  // Endpoints are placeholders — verify after partnership approval.
  chewy: {
    displayName:       'Chewy',
    authUrl:           'https://api.chewy.com/oauth2/authorize',
    tokenUrl:          'https://api.chewy.com/oauth2/token',
    scopes:            ['openid', 'profile', 'email', 'orders:write', 'offline_access'],
    supportsPKCE:      true,
    tokenAuthMethod:   'body',
    requiresApproval:  true,
    approvalNote:      'Chewy has no public OAuth API. Requires direct partnership with Chewy.',
    clientIdEnv:       'CHEWY_CLIENT_ID',
    clientSecretEnv:   'CHEWY_CLIENT_SECRET',
  },

  // ── Home Depot ────────────────────────────────────────────────────────────
  // developer.homedepot.com offers product-data APIs only.
  // Consumer purchase OAuth requires a separate Home Depot partnership agreement.
  // Endpoints are placeholders — verify after partnership approval.
  homedepot: {
    displayName:       'Home Depot',
    authUrl:           'https://api.homedepot.com/oauth2/authorize',
    tokenUrl:          'https://api.homedepot.com/oauth2/token',
    scopes:            ['openid', 'profile', 'email', 'cart:write', 'offline_access'],
    supportsPKCE:      true,
    tokenAuthMethod:   'body',
    requiresApproval:  true,
    approvalUrl:       'https://developer.homedepot.com',
    approvalNote:      'Home Depot developer program provides product-data APIs only. Purchase OAuth requires a separate partnership agreement.',
    clientIdEnv:       'HOMEDEPOT_CLIENT_ID',
    clientSecretEnv:   'HOMEDEPOT_CLIENT_SECRET',
  },
}

// ---------------------------------------------------------------------------
// PKCE utilities (RFC 7636)
// ---------------------------------------------------------------------------

export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url') // 43-char URL-safe string
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function generateStateNonce(): string {
  return crypto.randomBytes(16).toString('hex')
}

// ---------------------------------------------------------------------------
// Authorization URL builder
// ---------------------------------------------------------------------------

export function buildAuthUrl(
  config: OAuthConfig,
  params: {
    clientId: string
    redirectUri: string
    state: string
    codeChallenge?: string
  }
): string {
  const url = new URL(config.authUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('state', params.state)
  url.searchParams.set('scope', config.scopes.join(' '))

  if (config.supportsPKCE && params.codeChallenge) {
    url.searchParams.set('code_challenge', params.codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')
  }

  if (config.extraAuthParams) {
    for (const [k, v] of Object.entries(config.extraAuthParams)) {
      url.searchParams.set(k, v)
    }
  }

  return url.toString()
}

// ---------------------------------------------------------------------------
// Token exchange (authorization_code grant)
// ---------------------------------------------------------------------------

export async function exchangeCodeForToken(
  config: OAuthConfig,
  params: {
    code: string
    redirectUri: string
    codeVerifier?: string
    clientId: string
    clientSecret: string
  }
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type:   'authorization_code',
    code:         params.code,
    redirect_uri: params.redirectUri,
  })

  if (params.codeVerifier) body.set('code_verifier', params.codeVerifier)

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept':       'application/json',
  }

  if (config.tokenAuthMethod === 'basic') {
    const creds = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${creds}`
  } else {
    body.set('client_id', params.clientId)
    body.set('client_secret', params.clientSecret)
  }

  const resp = await fetch(config.tokenUrl, {
    method:  'POST',
    headers,
    body:    body.toString(),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Token exchange failed ${resp.status}: ${text}`)
  }

  return resp.json() as Promise<TokenResponse>
}

// ---------------------------------------------------------------------------
// Token refresh (refresh_token grant)
// ---------------------------------------------------------------------------

export async function refreshAccessToken(
  config: OAuthConfig,
  params: {
    refreshToken: string
    clientId: string
    clientSecret: string
  }
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: params.refreshToken,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept':       'application/json',
  }

  if (config.tokenAuthMethod === 'basic') {
    const creds = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${creds}`
  } else {
    body.set('client_id', params.clientId)
    body.set('client_secret', params.clientSecret)
  }

  const resp = await fetch(config.tokenUrl, {
    method:  'POST',
    headers,
    body:    body.toString(),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Token refresh failed ${resp.status}: ${text}`)
  }

  return resp.json() as Promise<TokenResponse>
}

// ---------------------------------------------------------------------------
// State cookie structure (stored httpOnly, verified in callback)
// ---------------------------------------------------------------------------

export interface OAuthStateCookie {
  nonce:    string  // random value sent as `state` to provider, verified on return
  userId:   string  // Supabase user ID — used to upsert the retailers row
  retailer: string  // slug (e.g. 'kroger')
  ts:       number  // Date.now() at initiation — enforces 15-min TTL
}

export const STATE_COOKIE = 'rx_oauth_state'
export const PKCE_COOKIE  = 'rx_oauth_pkce'
export const COOKIE_PATH  = '/api/retailers/oauth'
export const COOKIE_TTL   = 900 // seconds (15 min)
