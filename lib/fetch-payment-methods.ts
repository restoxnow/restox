/**
 * Retailer payment method fetchers.
 *
 * Security: these functions NEVER return or store full card numbers, CVVs,
 * or bank account details. Only non-sensitive display identifiers are returned
 * (last4, brand, expiry month/year, and the retailer's own opaque token).
 *
 * Currently, neither Amazon (LWA profile scope) nor Kroger expose payment
 * method APIs in their public developer programs. Both fall back to
 * pre-order confirmation mode until their APIs support it.
 *
 * Adding a new retailer: implement `fetch{RetailerName}PaymentMethods` below
 * and add a case to `fetchPaymentMethodsForRetailer`.
 */

export interface PaymentMethod {
  id: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
  retailer: string
}

// ---------------------------------------------------------------------------
// Amazon
// ---------------------------------------------------------------------------
async function fetchAmazonPaymentMethods(_accessToken: string): Promise<PaymentMethod[]> {
  // TODO: Amazon's Login with Amazon (LWA) profile scope does not expose
  // payment methods. Full payment method access requires the Amazon Pay API,
  // which is a separate program (pay.amazon.com/developer).
  // Until integrated, fall back to pre-order confirmation mode.
  return []
}

// ---------------------------------------------------------------------------
// Kroger
// ---------------------------------------------------------------------------
async function fetchKrogerPaymentMethods(_accessToken: string): Promise<PaymentMethod[]> {
  // TODO: The Kroger public developer API (developer.kroger.com) does not
  // currently expose a payment methods endpoint in any documented scope.
  // When Kroger adds this capability, implement here using the stored OAuth
  // access token:
  //
  //   GET https://api.kroger.com/v1/payment-methods  (endpoint TBC)
  //   Authorization: Bearer {accessToken}
  //
  // Map the response to PaymentMethod[] and return.
  // Until then, fall back to pre-order confirmation mode.
  return []
}

// ---------------------------------------------------------------------------
// Stub — all other retailers
// ---------------------------------------------------------------------------
async function fetchStubPaymentMethods(
  _accessToken: string,
  _retailerName: string,
): Promise<PaymentMethod[]> {
  // TODO: implement {_retailerName} payment method fetch when their API supports it.
  // Follow the same pattern as fetchKrogerPaymentMethods above.
  // Endpoint format will vary by retailer; check their developer documentation.
  return []
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------
export async function fetchPaymentMethodsForRetailer(
  retailerName: string,
  accessToken: string,
): Promise<PaymentMethod[]> {
  const lower = retailerName.toLowerCase()

  if (lower === 'amazon') {
    return fetchAmazonPaymentMethods(accessToken)
  }

  if (
    lower === 'kroger' ||
    lower === 'kroger (fred meyer)' ||
    lower === 'kroger (ralphs)'
  ) {
    return fetchKrogerPaymentMethods(accessToken)
  }

  return fetchStubPaymentMethods(accessToken, retailerName)
}
