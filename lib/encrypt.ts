import crypto from 'crypto'

// Derives a 32-byte key from ENCRYPTION_KEY env var.
// Add ENCRYPTION_KEY=<64-char hex string> to .env.local for production.
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY ?? 'change-this-default-key-in-production'
  return crypto.scryptSync(secret, 'restox-plaid-salt', 32)
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(ciphertext: string): string {
  const [ivHex, encHex] = ciphertext.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const enc = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), iv)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
