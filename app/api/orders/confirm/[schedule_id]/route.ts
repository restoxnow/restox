import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/log-error'
import { verifyOrderToken } from '@/lib/order-token'
import { decrypt } from '@/lib/encrypt'
import { addToKrogerCart } from '@/lib/retailers/kroger-cart'
import { buildAmazonCartUrl, isValidAsin } from '@/lib/retailers/amazon-cart'
import { resolveProductUrl } from '@/lib/retailers/retailer-urls'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

/** Sends a "your Kroger cart is ready" notification via SendGrid. */
async function sendKrogerCartFilledEmail(
  userEmail: string,
  productName: string,
): Promise<void> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return

  const textBody = [
    'Hi,',
    '',
    `Your Restox reorder for ${productName} has been added to your Kroger cart automatically.`,
    '',
    'Complete your Kroger order:',
    'https://www.kroger.com/cart',
    '',
    'Your cart is ready — just review and checkout.',
    '',
    '— The Restox Team',
  ].join('\n')

  const htmlBody = [
    '<p>Hi,</p>',
    `<p>Your Restox reorder for <strong>${productName}</strong> has been added to your Kroger cart automatically.</p>`,
    '<p style="margin:24px 0;">',
    '  <a href="https://www.kroger.com/cart" style="display:inline-block;padding:12px 24px;background:#F47C20;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">Complete your Kroger order &#8594;</a>',
    '</p>',
    '<p>Your cart is ready &mdash; just review and checkout.</p>',
    '<p>&mdash; The Restox Team</p>',
  ].join('\n')

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method:  'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: userEmail }] }],
      from:    { email: 'orders@restox.net', name: 'Restox' },
      subject: 'Your Kroger cart is ready — complete your order',
      content: [
        { type: 'text/plain', value: textBody },
        { type: 'text/html',  value: htmlBody },
      ],
    }),
  }).catch(() => { /* non-fatal */ })
}

/** Sends a "complete your Amazon reorder" email with a direct Add-to-Cart deep link. */
async function sendAmazonCartEmail(
  userEmail:   string,
  productName: string,
  cartUrl:     string,
): Promise<void> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return

  const textBody = [
    'Hi,',
    '',
    `It's time to reorder ${productName} on Amazon.`,
    '',
    'Click the link below to add it to your Amazon cart instantly:',
    cartUrl,
    '',
    'Your affiliate link includes the Restox tag — thanks for supporting us!',
    '',
    '— The Restox Team',
  ].join('\n')

  const htmlBody = [
    '<p>Hi,</p>',
    `<p>It's time to reorder <strong>${productName}</strong> on Amazon.</p>`,
    '<p style="margin:24px 0;">',
    `  <a href="${cartUrl}" style="display:inline-block;padding:12px 24px;background:#F47C20;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">Add to Amazon Cart &#8594;</a>`,
    '</p>',
    '<p style="color:#9ca3af;font-size:13px;">Your affiliate link includes the Restox tag &mdash; thanks for supporting us!</p>',
    '<p>&mdash; The Restox Team</p>',
  ].join('\n')

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method:  'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: userEmail }] }],
      from:    { email: 'orders@restox.net', name: 'Restox' },
      subject: 'Complete your Amazon reorder — cart link inside',
      content: [
        { type: 'text/plain', value: textBody },
        { type: 'text/html',  value: htmlBody },
      ],
    }),
  }).catch(() => { /* non-fatal */ })
}

/** Sends a fallback email when cart fill failed — links to product page for manual add. */
async function sendKrogerFallbackEmail(
  userEmail:   string,
  productName: string,
  productUrl:  string | null,
): Promise<void> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return

  const shopUrl = productUrl ?? 'https://www.kroger.com/search'

  const textBody = [
    'Hi,',
    '',
    `Your order for ${productName} has been confirmed, but we couldn't automatically add it to your Kroger cart.`,
    '',
    'Please add it to your cart manually:',
    shopUrl,
    '',
    '— The Restox Team',
  ].join('\n')

  const htmlBody = [
    '<p>Hi,</p>',
    `<p>Your order for <strong>${productName}</strong> has been confirmed, but we couldn’t automatically add it to your Kroger cart.</p>`,
    '<p style="margin:24px 0;">',
    `  <a href="${shopUrl}" style="display:inline-block;padding:12px 24px;background:#F47C20;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">Add to Kroger cart &#8594;</a>`,
    '</p>',
    '<p>&mdash; The Restox Team</p>',
  ].join('\n')

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method:  'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: userEmail }] }],
      from:    { email: 'orders@restox.net', name: 'Restox' },
      subject: 'Action needed: add your Kroger item to cart',
      content: [
        { type: 'text/plain', value: textBody },
        { type: 'text/html',  value: htmlBody },
      ],
    }),
  }).catch(() => { /* non-fatal */ })
}

/**
 * Generic "time to reorder" reminder email for all non-Kroger, non-Amazon
 * retailers. Links directly to the product page if available, or falls back
 * to the retailer homepage.
 */
async function sendGenericReminderEmail(
  userEmail:    string,
  productName:  string,
  retailerName: string,
  shopUrl:      string,
): Promise<void> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return

  const hasProductPage = shopUrl.includes('/') && !['walmart.com','target.com','costco.com',
    'homedepot.com','sephora.com','chewy.com','ulta.com','walgreens.com','cvs.com',
    'safeway.com','albertsons.com','publix.com','wholefoodsmarket.com','samsclub.com',
    'petco.com','petsmart.com','riteaid.com','dollargeneral.com','instacart.com',
    'shipt.com','iherb.com','vitacost.com','thrivemarket.com',
  ].some(h => new URL(shopUrl).hostname.endsWith(h) && new URL(shopUrl).pathname === '/')

  const ctaLabel  = hasProductPage ? 'View product and reorder →' : `Shop ${retailerName} →`
  const bodyNote  = hasProductPage
    ? 'This link takes you directly to the product page. Add it to your cart and checkout to complete your order.'
    : `We don't have a direct product link on file — click below to visit ${retailerName} and search for your item.`

  const textBody = [
    'Hi,',
    '',
    `Your scheduled reorder for ${productName} from ${retailerName} is coming up.`,
    '',
    ctaLabel,
    shopUrl,
    '',
    bodyNote,
    '',
    '— The Restox Team',
  ].join('\n')

  const htmlBody = [
    '<p>Hi,</p>',
    `<p>Your scheduled reorder for <strong>${productName}</strong> from <strong>${retailerName}</strong> is coming up.</p>`,
    '<p style="margin:24px 0;">',
    `  <a href="${shopUrl}" style="display:inline-block;padding:12px 24px;background:#F47C20;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">${ctaLabel}</a>`,
    '</p>',
    `<p style="color:#9ca3af;font-size:13px;">${bodyNote}</p>`,
    '<p>&mdash; The Restox Team</p>',
  ].join('\n')

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method:  'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: userEmail }] }],
      from:    { email: 'orders@restox.net', name: 'Restox' },
      subject: `Time to reorder ${productName} from ${retailerName}`,
      content: [
        { type: 'text/plain', value: textBody },
        { type: 'text/html',  value: htmlBody },
      ],
    }),
  }).catch(() => { /* non-fatal */ })
}

// ---------------------------------------------------------------------------
// Kroger cart fill helper — shared by POST and GET handlers
// ---------------------------------------------------------------------------

interface KrogerFillParams {
  admin:          ReturnType<typeof adminClient>
  userId:         string
  confirmationId: string
  productName:    string
  productUrl:     string | null
  upc:            string | null
}

interface KrogerFillResult {
  cartFilled: boolean
  notes:      string
  message:    string
}

async function tryKrogerCartFill(p: KrogerFillParams): Promise<KrogerFillResult> {
  const { admin, userId, confirmationId, productName, productUrl, upc } = p

  const markConfirmed = async (notes: string) =>
    admin
      .from('order_confirmations')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), notes })
      .eq('id', confirmationId)

  // Can't fill without UPC
  if (!upc) {
    await markConfirmed('Cart fill skipped — no UPC on record')
    return {
      cartFilled: false,
      notes:      'Cart fill skipped — no UPC on record',
      message:    'Order confirmed — no UPC stored, cart not filled automatically',
    }
  }

  // Look up Kroger OAuth connection — two-query pattern
  const { data: retailerRow } = await admin
    .from('retailers')
    .select('access_token, refresh_token')
    .eq('user_id', userId)
    .eq('name', 'Kroger')
    .single()

  if (!retailerRow?.access_token) {
    await markConfirmed('Cart fill skipped — no Kroger OAuth connection')
    return {
      cartFilled: false,
      notes:      'Cart fill skipped — no Kroger OAuth connection',
      message:    'Order confirmed — no Kroger OAuth connection found',
    }
  }

  let accessToken: string
  let refreshToken: string | null = null
  try {
    accessToken  = decrypt(retailerRow.access_token)
    refreshToken = retailerRow.refresh_token ? decrypt(retailerRow.refresh_token) : null
  } catch {
    await markConfirmed('Cart fill skipped — token decryption failed')
    return {
      cartFilled: false,
      notes:      'Cart fill skipped — token decryption failed',
      message:    'Order confirmed — could not read Kroger credentials',
    }
  }

  const result = await addToKrogerCart({
    accessToken,
    refreshToken,
    items: [{ upc, quantity: 1 }],
    userId,
  })

  const notes = result.success
    ? 'Cart filled — user notified to checkout'
    : `Cart fill failed: ${result.error ?? 'unknown error'}`

  await markConfirmed(notes)

  // Get user email and send notification
  const { data: userRow } = await admin
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  const userEmail = userRow?.email as string | undefined
  if (userEmail) {
    if (result.success) {
      await sendKrogerCartFilledEmail(userEmail, productName)
    } else {
      await sendKrogerFallbackEmail(userEmail, productName, productUrl)
    }
  }

  return {
    cartFilled: result.success,
    notes,
    message: result.success
      ? 'Kroger cart filled — check your cart to complete checkout'
      : `Order confirmed — cart fill failed (${result.error ?? 'unknown'}); fallback email sent`,
  }
}

// ---------------------------------------------------------------------------
// POST /api/orders/confirm/[schedule_id]
// Session-authenticated: called from the dashboard UI.
// ---------------------------------------------------------------------------
export async function POST(
  _req: NextRequest,
  { params }: { params: { schedule_id: string } }
) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { schedule_id } = params
  const admin = adminClient()

  // Two-query pattern: verify ownership separately
  const { data: schedule } = await admin
    .from('purchase_schedules')
    .select('id, user_id, product_name, retailer, product_url, upc, asin')
    .eq('id', schedule_id)
    .single()

  if (!schedule || schedule.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: confirmation } = await admin
    .from('order_confirmations')
    .select('id, status')
    .eq('schedule_id', schedule_id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!confirmation) {
    return NextResponse.json({ error: 'No pending confirmation found for this schedule' }, { status: 404 })
  }

  // ── Kroger: attempt cart fill ──────────────────────────────────────────────
  if (schedule.retailer?.toLowerCase() === 'kroger') {
    try {
      const fill = await tryKrogerCartFill({
        admin,
        userId:         user.id,
        confirmationId: confirmation.id,
        productName:    schedule.product_name ?? 'your product',
        productUrl:     schedule.product_url  ?? null,
        upc:            schedule.upc          ?? null,
      })
      return NextResponse.json({
        ok:         true,
        cartFilled: fill.cartFilled,
        message:    fill.message,
      })
    } catch (err) {
      await logError({ route: `/api/orders/confirm/${schedule_id}`, error: err, userId: user.id })
      // Fall through to generic confirm
    }
  }

  // ── Amazon: build Add-to-Cart deep link and email ─────────────────────────
  if (schedule.retailer?.toLowerCase() === 'amazon' && isValidAsin(schedule.asin)) {
    try {
      const cartUrl = buildAmazonCartUrl(schedule.asin)

      await admin
        .from('order_confirmations')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), notes: 'Amazon Add-to-Cart link sent' })
        .eq('id', confirmation.id)

      const { data: userRow } = await admin
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single()

      if (userRow?.email) {
        await sendAmazonCartEmail(userRow.email as string, schedule.product_name ?? 'your product', cartUrl)
      }

      return NextResponse.json({
        ok:      true,
        cartUrl,
        message: 'Amazon Add-to-Cart link sent to your email',
      })
    } catch (err) {
      await logError({ route: `/api/orders/confirm/${schedule_id}`, error: err, userId: user.id })
      // Fall through to generic confirm
    }
  }

  // ── Generic: smart product-page reminder email ────────────────────────────
  {
    const shopUrl = resolveProductUrl(schedule.product_url, schedule.retailer)
    const retailerName = schedule.retailer ?? 'your retailer'
    const productName  = schedule.product_name ?? 'your product'
    const notes = shopUrl
      ? `Reminder email sent — product link: ${shopUrl}`
      : 'Reminder email sent — no product URL on record'

    const { error } = await admin
      .from('order_confirmations')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), notes })
      .eq('id', confirmation.id)

    if (error) {
      await logError({ route: `/api/orders/confirm/${schedule_id}`, error, userId: user.id })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (shopUrl) {
      const { data: userRow } = await admin
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single()

      if (userRow?.email) {
        await sendGenericReminderEmail(userRow.email as string, productName, retailerName, shopUrl)
      }
    }

    return NextResponse.json({
      ok:      true,
      shopUrl,
      message: shopUrl
        ? `Reminder email sent with link to ${retailerName}`
        : 'Order confirmed — no product URL available',
    })
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders/confirm/[schedule_id]?token=...
// Token-based confirm for one-click email links — no login required.
// ---------------------------------------------------------------------------
const HTML = (title: string, emoji: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Restox</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:white;border-radius:16px;padding:48px 40px;max-width:440px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    h1{color:#1A1A2E;font-size:22px;margin:0 0 12px}
    p{color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px}
    a{display:inline-block;padding:10px 24px;background:#F47C20;color:white;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600}
    .icon{font-size:40px;margin-bottom:16px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${emoji}</div>
    <h1>${title}</h1>
    ${body}
    <a href="https://restox.net/dashboard">Go to Dashboard</a>
  </div>
</body>
</html>`

export async function GET(
  req: NextRequest,
  { params }: { params: { schedule_id: string } }
) {
  const { schedule_id } = params
  const token = req.nextUrl.searchParams.get('token')

  if (!token || !verifyOrderToken(token, schedule_id, 'confirm')) {
    return new NextResponse(
      HTML('Invalid link', '❌', '<p>This confirmation link is invalid or has expired. Please visit your dashboard to manage your orders.</p>'),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const admin = adminClient()

  // Find pending confirmation (include user_id for downstream queries)
  const { data: conf } = await admin
    .from('order_confirmations')
    .select('id, user_id')
    .eq('schedule_id', schedule_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!conf) {
    return new NextResponse(
      HTML('Already actioned', 'ℹ️', '<p>This order has already been confirmed or skipped. Check your dashboard for the latest status.</p>'),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // Fetch schedule for Kroger cart fill
  const { data: schedule } = await admin
    .from('purchase_schedules')
    .select('product_name, retailer, product_url, upc, asin')
    .eq('id', schedule_id)
    .single()

  // ── Kroger: attempt cart fill ────────────────────────────────────────────
  if (schedule?.retailer?.toLowerCase() === 'kroger') {
    try {
      const fill = await tryKrogerCartFill({
        admin,
        userId:         conf.user_id,
        confirmationId: conf.id,
        productName:    schedule.product_name ?? 'your product',
        productUrl:     schedule.product_url  ?? null,
        upc:            schedule.upc          ?? null,
      })

      if (fill.cartFilled) {
        return new NextResponse(
          HTML(
            'Kroger cart filled!',
            '🛒',
            '<p>Your Kroger cart has been filled automatically. Click below to review your cart and complete checkout.</p>' +
            '<p style="margin-bottom:24px;"><a href="https://www.kroger.com/cart" style="display:inline-block;padding:10px 24px;background:#F47C20;color:white;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">Complete your Kroger order &rarr;</a></p>',
          ),
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        )
      } else {
        const productUrl = schedule.product_url ?? 'https://www.kroger.com/search'
        return new NextResponse(
          HTML(
            'Order confirmed',
            '✅',
            `<p>Your order has been confirmed. We couldn’t automatically fill your Kroger cart — please add the item manually.</p>` +
            `<p style="margin-bottom:24px;"><a href="${productUrl}" style="display:inline-block;padding:10px 24px;background:#F47C20;color:white;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">Add to Kroger cart &rarr;</a></p>`,
          ),
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        )
      }
    } catch {
      // Fall through to generic confirm
    }
  }

  // ── Amazon: build Add-to-Cart deep link and email ──────────────────────
  if (schedule?.retailer?.toLowerCase() === 'amazon' && isValidAsin(schedule.asin)) {
    try {
      const cartUrl = buildAmazonCartUrl(schedule.asin)

      await admin
        .from('order_confirmations')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), notes: 'Amazon Add-to-Cart link sent' })
        .eq('id', conf.id)

      const { data: userRow } = await admin
        .from('users')
        .select('email')
        .eq('id', conf.user_id)
        .single()

      if (userRow?.email) {
        await sendAmazonCartEmail(userRow.email as string, schedule.product_name ?? 'your product', cartUrl)
      }

      return new NextResponse(
        HTML(
          'Amazon cart link sent!',
          '📦',
          '<p>We\'ve emailed you a direct link to add this item to your Amazon cart. Check your inbox!</p>' +
          `<p style="margin-bottom:24px;"><a href="${cartUrl}" style="display:inline-block;padding:10px 24px;background:#F47C20;color:white;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">Add to Amazon Cart &rarr;</a></p>`,
        ),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    } catch {
      // Fall through to generic confirm
    }
  }

  // ── Generic: smart product-page reminder email ──────────────────────────
  {
    const shopUrl      = resolveProductUrl(schedule?.product_url, schedule?.retailer)
    const retailerName = schedule?.retailer     ?? 'your retailer'
    const productName  = schedule?.product_name ?? 'your product'
    const notes = shopUrl
      ? `Reminder email sent — product link: ${shopUrl}`
      : 'Reminder email sent — no product URL on record'

    await admin
      .from('order_confirmations')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), notes })
      .eq('id', conf.id)

    if (shopUrl) {
      const { data: userRow } = await admin
        .from('users')
        .select('email')
        .eq('id', conf.user_id)
        .single()

      if (userRow?.email) {
        await sendGenericReminderEmail(userRow.email as string, productName, retailerName, shopUrl)
      }
    }

    if (shopUrl) {
      return new NextResponse(
        HTML(
          'Order confirmed!',
          '✅',
          `<p>Your reorder for <strong>${productName}</strong> from <strong>${retailerName}</strong> has been confirmed. We've sent you a link to reorder directly.</p>` +
          `<p style="margin-bottom:24px;"><a href="${shopUrl}" style="display:inline-block;padding:10px 24px;background:#F47C20;color:white;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">View product and reorder &rarr;</a></p>`,
        ),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    }

    return new NextResponse(
      HTML('Order confirmed!', '✅', `<p>Your reorder for <strong>${productName}</strong> from <strong>${retailerName}</strong> has been confirmed.</p>`),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }
}
