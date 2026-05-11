import { createHmac } from 'crypto'

// Signs schedule tokens for confirm/skip email links.
// Action is included in the signed payload to prevent a confirm token
// from being replayed on the skip endpoint and vice versa.
function secret() {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  return s
}

export function signOrderToken(scheduleId: string, action: 'confirm' | 'skip'): string {
  const data    = `${scheduleId}:${action}`
  const payload = Buffer.from(data).toString('base64url')
  const sig     = createHmac('sha256', secret()).update(data).digest('hex').slice(0, 32)
  return `${payload}.${sig}`
}

export function verifyOrderToken(
  token: string,
  scheduleId: string,
  action: 'confirm' | 'skip',
): boolean {
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const payloadB64 = token.slice(0, dot)
  const sig        = token.slice(dot + 1)
  let decoded: string
  try {
    decoded = Buffer.from(payloadB64, 'base64url').toString('utf-8')
  } catch {
    return false
  }
  if (decoded !== `${scheduleId}:${action}`) return false
  const expected = createHmac('sha256', secret()).update(decoded).digest('hex').slice(0, 32)
  return sig === expected
}
