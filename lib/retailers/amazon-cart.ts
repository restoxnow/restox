/**
 * lib/retailers/amazon-cart.ts
 *
 * Builds Amazon Add-to-Cart deep links for order confirmation emails.
 * No OAuth required — these are affiliate-tagged product URLs that trigger
 * Amazon's Add-to-Cart flow when the user taps the link.
 */

const ASSOCIATE_ID = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID ?? 'restox-20'

/**
 * Builds an Amazon Add-to-Cart deep link for the given ASIN.
 *
 * Uses Amazon's actionCode=DOWNLOAD_AND_ADD_TO_CART parameter, which triggers
 * automatic cart addition when clicked. Always includes the restox-20 affiliate tag.
 *
 * @param asin        10-character Amazon ASIN (e.g. "B07ZPKN6YR")
 * @param associateId Optional override for the affiliate tag (defaults to restox-20)
 */
export function buildAmazonCartUrl(asin: string, associateId?: string): string {
  const tag = associateId ?? ASSOCIATE_ID
  return `https://www.amazon.com/dp/${asin}?actionCode=DOWNLOAD_AND_ADD_TO_CART&tag=${tag}`
}

/**
 * Validates that a string is a well-formed Amazon ASIN (10 alphanumeric chars).
 */
export function isValidAsin(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[A-Z0-9]{10}$/i.test(value)
}
