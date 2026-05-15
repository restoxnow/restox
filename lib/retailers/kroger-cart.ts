/**
 * lib/retailers/kroger-cart.ts
 *
 * Kroger Cart API integration — adds items to a user's Kroger cart using the
 * cart.basic:write OAuth scope.
 *
 * Certification environment: api-ce.kroger.com
 * Handles 401 token expiry by refreshing via refresh_token and persisting the
 * new tokens back to the retailers table before retrying the cart add.
 */

import { createClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/encrypt'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const KROGER_BASE      = 'https://api-ce.kroger.com'
const KROGER_TOKEN_URL = `${KROGER_BASE}/v1/connect/oauth2/token`
const KROGER_CART_URL  = `${KROGER_BASE}/v1/cart/add`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface KrogerCartItem {
  upc: string
  quantity: number
}

export interface AddToKrogerCartParams {
  accessToken:  string
  refreshToken: string | null
  items:        KrogerCartItem[]
  /** user_id — needed to persist refreshed tokens back to DB */
  userId:       string
}

export interface AddToKrogerCartResult {
  success: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** POST items to the Kroger cart; returns HTTP status code. */
async function callCartAdd(token: string, items: KrogerCartItem[]): Promise<number> {
  try {
    const res = await fetch(KROGER_CART_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        items: items.map(item => ({
          upc:        item.upc,
          quantity:   item.quantity,
          modalities: ['PICKUP'],
        })),
      }),
    })
    return res.status
  } catch {
    return 500
  }
}

/** Exchange a Kroger refresh_token for new access + refresh tokens. */
async function refreshKrogerToken(
  currentRefreshToken: string,
): Promise<{ access_token: string; refresh_token?: string } | null> {
  const clientId     = process.env.KROGER_CLIENT_ID     ?? ''
  const clientSecret = process.env.KROGER_CLIENT_SECRET ?? ''

  if (!clientId || !clientSecret) return null

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    const res = await fetch(KROGER_TOKEN_URL, {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: currentRefreshToken,
      }).toString(),
    })

    if (!res.ok) return null
    return (await res.json()) as { access_token: string; refresh_token?: string }
  } catch {
    return null
  }
}

/** Persist freshly-obtained tokens back to the retailers table. */
async function persistRefreshedTokens(
  userId: string,
  newAccessToken: string,
  newRefreshToken?: string,
): Promise<void> {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    await admin
      .from('retailers')
      .update({
        access_token: encrypt(newAccessToken),
        ...(newRefreshToken ? { refresh_token: encrypt(newRefreshToken) } : {}),
      })
      .eq('user_id', userId)
      .eq('name', 'Kroger')
  } catch {
    // Non-fatal — the retry will still use the in-memory token
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Adds items to the user's Kroger cart.
 *
 * Flow:
 *  1. Try cart add with current access_token.
 *  2. If 401 and refresh_token available: refresh tokens, persist them, retry.
 *  3. Return success/failure.
 */
export async function addToKrogerCart(
  params: AddToKrogerCartParams,
): Promise<AddToKrogerCartResult> {
  const { items, userId } = params
  let accessToken = params.accessToken

  // First attempt
  let status = await callCartAdd(accessToken, items)

  if (status === 401 && params.refreshToken) {
    const newTokens = await refreshKrogerToken(params.refreshToken)

    if (!newTokens) {
      return {
        success: false,
        error:   'Token refresh failed — user may need to reconnect Kroger',
      }
    }

    // Persist and retry
    await persistRefreshedTokens(userId, newTokens.access_token, newTokens.refresh_token)
    accessToken = newTokens.access_token
    status = await callCartAdd(accessToken, items)
  }

  if (status >= 200 && status < 300) {
    return { success: true }
  }

  return {
    success: false,
    error:   `Kroger cart API returned HTTP ${status}`,
  }
}
