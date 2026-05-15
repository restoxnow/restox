/**
 * lib/retailers/retailer-urls.ts
 *
 * Fallback homepage URLs for all supported retailers.
 * Used when a purchase_schedule has no stored product_url —
 * the generic confirmation email links to the retailer homepage
 * instead of a specific product page.
 *
 * Keys are lowercased retailer names (matched case-insensitively).
 */

export const RETAILER_HOMEPAGES: Record<string, string> = {
  walmart:       'https://www.walmart.com',
  target:        'https://www.target.com',
  costco:        'https://www.costco.com',
  'home depot':  'https://www.homedepot.com',
  homedepot:     'https://www.homedepot.com',
  sephora:       'https://www.sephora.com',
  chewy:         'https://www.chewy.com',
  ulta:          'https://www.ulta.com',
  walgreens:     'https://www.walgreens.com',
  cvs:           'https://www.cvs.com',
  'cvs pharmacy':'https://www.cvs.com',
  safeway:       'https://www.safeway.com',
  albertsons:    'https://www.albertsons.com',
  publix:        'https://www.publix.com',
  'whole foods': 'https://www.wholefoodsmarket.com',
  wholefoods:    'https://www.wholefoodsmarket.com',
  "sam's club":  'https://www.samsclub.com',
  samsclub:      'https://www.samsclub.com',
  petco:         'https://www.petco.com',
  petsmart:      'https://www.petsmart.com',
  'rite aid':    'https://www.riteaid.com',
  riteaid:       'https://www.riteaid.com',
  'dollar general': 'https://www.dollargeneral.com',
  dollargeneral: 'https://www.dollargeneral.com',
  instacart:     'https://www.instacart.com',
  shipt:         'https://www.shipt.com',
  iherb:         'https://www.iherb.com',
  vitacost:      'https://www.vitacost.com',
  thrive:        'https://thrivemarket.com',
  'thrive market':'https://thrivemarket.com',
}

/**
 * Returns the best available URL for a retailer:
 *   1. product_url if present (direct product page link)
 *   2. homepage from RETAILER_HOMEPAGES if retailer name is recognized
 *   3. null if nothing is known
 */
export function resolveProductUrl(
  productUrl:   string | null | undefined,
  retailerName: string | null | undefined,
): string | null {
  if (productUrl) return productUrl
  if (!retailerName) return null
  return RETAILER_HOMEPAGES[retailerName.toLowerCase().trim()] ?? null
}
