const ASSOCIATE_ID =
  process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID ?? 'restox-20'

const AMAZON_HOSTNAMES = [
  'amazon.com', 'www.amazon.com',
  'amazon.co.uk', 'www.amazon.co.uk',
  'amazon.ca', 'www.amazon.ca',
  'amazon.com.au', 'www.amazon.com.au',
  'amazon.de', 'www.amazon.de',
  'amazon.fr', 'www.amazon.fr',
  'amazon.co.jp', 'www.amazon.co.jp',
]

export function isAmazonUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return AMAZON_HOSTNAMES.includes(hostname)
  } catch {
    return false
  }
}

export function addAffiliateTag(url: string): string {
  if (!url || !isAmazonUrl(url)) return url
  try {
    const u = new URL(url)
    // Never double-append
    if (u.searchParams.get('tag') === ASSOCIATE_ID) return url
    u.searchParams.set('tag', ASSOCIATE_ID)
    return u.toString()
  } catch {
    return url
  }
}
