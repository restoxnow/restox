/**
 * Client-safe OAuth status metadata — no Node.js imports.
 * Import this in client components instead of retailer-oauth.ts.
 */

export type OAuthStatus = 'live' | 'coming-soon' | 'none'

/** Keyed by retailer display name (matches retailers.name in DB) */
export const OAUTH_STATUS_BY_NAME: Record<string, OAuthStatus> = {
  'Amazon':   'live',
  'Kroger':   'live',
  'Walmart':  'coming-soon',
  'Instacart': 'coming-soon',
}

/** Slug used in /api/retailers/oauth/[slug] for live retailers only */
export const OAUTH_SLUG_BY_NAME: Record<string, string> = {
  'Amazon': 'amazon',
  'Kroger': 'kroger',
}
