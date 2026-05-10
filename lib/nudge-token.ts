import { createHmac } from 'crypto'

// Uses the service role key as signing secret — already in env, no new secret needed.
// Tokens are deterministic per userId (no expiry — unsubscribe is permanent until re-enabled).
function secret() {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  return s
}

export function signNudgeToken(userId: string): string {
  const payload = Buffer.from(userId).toString('base64url')
  const sig = createHmac('sha256', secret()).update(userId).digest('hex').slice(0, 32)
  return `${payload}.${sig}`
}

export function verifyNudgeToken(token: string): string | null {
  const dot = token.indexOf('.')
  if (dot === -1) return null
  const payloadB64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  let userId: string
  try {
    userId = Buffer.from(payloadB64, 'base64url').toString('utf-8')
  } catch {
    return null
  }
  const expected = createHmac('sha256', secret()).update(userId).digest('hex').slice(0, 32)
  if (sig !== expected) return null
  return userId
}
