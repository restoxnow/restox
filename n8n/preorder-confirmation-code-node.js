// ─────────────────────────────────────────────────────────────────────────────
// Restox — Process Schedule Code Node
// Paste this entire file into the "Process Schedule" Code node in n8n.
//
// Retailer routing:
//   Kroger  → "we'll fill your cart automatically" — no Confirm/Skip buttons
//   Amazon  → "tap Confirm for an Add-to-Cart link" — Confirm + Skip buttons
//   Others  → "tap Confirm for a direct product link" — Confirm + Skip buttons
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

const SUPABASE_URL = 'https://vjptwvubebxjjkxkzqqe.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'SUPABASE_SERVICE_ROLE_KEY_HERE';
const SENDGRID_KEY = process.env.SENDGRID_API_KEY           || 'SENDGRID_API_KEY_HERE';
const SITE_URL     = 'https://restox.net';

const sbHeaders = {
  'apikey':        SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type':  'application/json',
};

function signOrderToken(scheduleId, action) {
  const data    = scheduleId + ':' + action;
  const payload = Buffer.from(data).toString('base64url');
  const sig     = crypto.createHmac('sha256', SUPABASE_KEY).update(data).digest('hex').slice(0, 32);
  return payload + '.' + sig;
}

// ── Retailer detection ────────────────────────────────────────────────────────
function retailerType(retailerName) {
  if (!retailerName) return 'other';
  const r = retailerName.toLowerCase().trim();
  if (r === 'kroger') return 'kroger';
  if (r === 'amazon') return 'amazon';
  return 'other';
}

// ── Retailer-specific email content ──────────────────────────────────────────
function buildEmailContent({ type, productName, retailer, formattedDate, confirmUrl, skipUrl, schedulesUrl }) {
  const ctaStyle   = 'display:inline-block;padding:12px 24px;background:#F47C20;color:white;border-radius:8px;text-decoration:none;font-weight:bold;';
  const skipStyle  = 'display:inline-block;padding:12px 24px;background:#6b7280;color:white;border-radius:8px;text-decoration:none;font-weight:bold;';
  const mutedStyle = 'color:#9ca3af;font-size:13px;';

  if (type === 'kroger') {
    // No Confirm/Skip — cart fill is fully automatic on order date.
    const subject  = 'Your Kroger reorder is coming up — we’ll fill your cart automatically';
    const htmlBody = [
      '<p>Hi,</p>',
      '<p>Your scheduled reorder for <strong>' + productName + '</strong> is due on <strong>' + formattedDate + '</strong>.</p>',
      '<p>Restox will automatically add it to your Kroger cart. You’ll receive a notification when your cart is ready to checkout.</p>',
      '<p style="margin:24px 0;">',
      '  <a href="' + schedulesUrl + '" style="' + ctaStyle + '">View your schedule →</a>',
      '</p>',
      '<p style="' + mutedStyle + '">No action needed — we’ll handle the cart automatically.</p>',
      '<p>— The Restox Team</p>',
    ].join('\n');
    const textBody = [
      'Hi,',
      '',
      'Your scheduled reorder for ' + productName + ' is due on ' + formattedDate + '.',
      '',
      'Restox will automatically add it to your Kroger cart. You’ll receive a notification when your cart is ready to checkout.',
      '',
      'View your schedule:',
      schedulesUrl,
      '',
      'No action needed — we’ll handle the cart automatically.',
      '',
      '— The Restox Team',
    ].join('\n');
    return { subject, htmlBody, textBody };
  }

  if (type === 'amazon') {
    const subject  = 'Your Amazon reorder is coming up — cart link incoming';
    const htmlBody = [
      '<p>Hi,</p>',
      '<p>Your scheduled reorder for <strong>' + productName + '</strong> from <strong>Amazon</strong> is due on <strong>' + formattedDate + '</strong>.</p>',
      '<p>Tap Confirm below and we’ll send you a direct Add-to-Cart link.</p>',
      '<p style="margin:24px 0;">',
      '  <a href="' + confirmUrl + '" style="' + ctaStyle + '">Confirm this order →</a>',
      '</p>',
      '<p>',
      '  <a href="' + skipUrl + '" style="' + skipStyle + '">Skip this order →</a>',
      '</p>',
      '<p style="' + mutedStyle + '">If you don’t respond, the order will be confirmed automatically.</p>',
      '<p>— The Restox Team</p>',
    ].join('\n');
    const textBody = [
      'Hi,',
      '',
      'Your scheduled reorder for ' + productName + ' from Amazon is due on ' + formattedDate + '.',
      '',
      'Tap Confirm below and we’ll send you a direct Add-to-Cart link.',
      '',
      'Confirm this order:',
      confirmUrl,
      '',
      'Skip this order:',
      skipUrl,
      '',
      'If you don’t respond, the order will be confirmed automatically.',
      '',
      '— The Restox Team',
    ].join('\n');
    return { subject, htmlBody, textBody };
  }

  // ── Generic (all other retailers) ─────────────────────────────────────────
  const subject  = 'Your reorder of ' + productName + ' is coming up';
  const htmlBody = [
    '<p>Hi,</p>',
    '<p>Your scheduled reorder for <strong>' + productName + '</strong> from <strong>' + retailer + '</strong> is due on <strong>' + formattedDate + '</strong>.</p>',
    '<p>Tap Confirm to get a direct link to the product page so you can add it to your cart and checkout.</p>',
    '<p style="margin:24px 0;">',
    '  <a href="' + confirmUrl + '" style="' + ctaStyle + '">Confirm this order →</a>',
    '</p>',
    '<p>',
    '  <a href="' + skipUrl + '" style="' + skipStyle + '">Skip this order →</a>',
    '</p>',
    '<p style="' + mutedStyle + '">If you don’t respond, the order will be confirmed automatically.</p>',
    '<p>— The Restox Team</p>',
  ].join('\n');
  const textBody = [
    'Hi,',
    '',
    'Your scheduled reorder for ' + productName + ' from ' + retailer + ' is due on ' + formattedDate + '.',
    '',
    'Tap Confirm to get a direct link to the product page so you can add it to your cart and checkout.',
    '',
    'Confirm this order:',
    confirmUrl,
    '',
    'Skip this order:',
    skipUrl,
    '',
    'If you don’t respond, the order will be confirmed automatically.',
    '',
    '— The Restox Team',
  ].join('\n');
  return { subject, htmlBody, textBody };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main logic
// ─────────────────────────────────────────────────────────────────────────────

const schedule    = $input.first().json;
const scheduleId  = schedule.id;
const userId      = schedule.user_id;
const productName = schedule.product_name || 'your product';
const retailer    = schedule.retailer     || 'your retailer';
const orderDate   = schedule.next_order_date; // YYYY-MM-DD

if (!scheduleId || !userId || !orderDate) return [];

// ── Step 1: Check if already notified ────────────────────────────────────────
const checkUrl = SUPABASE_URL + '/rest/v1/order_confirmations'
  + '?schedule_id=eq.'          + encodeURIComponent(scheduleId)
  + '&scheduled_order_date=eq.' + orderDate
  + '&status=eq.pending'
  + '&select=id&limit=1';

let existing = [];
try {
  const res = await $helpers.httpRequest({ method: 'GET', url: checkUrl, headers: sbHeaders });
  existing = Array.isArray(res) ? res : [];
} catch (e) { existing = []; }

if (existing.length > 0) {
  return [{ json: { ok: false, reason: 'already_notified', scheduleId } }];
}

// ── Step 2: Create order_confirmation row ─────────────────────────────────────
try {
  await $helpers.httpRequest({
    method:  'POST',
    url:     SUPABASE_URL + '/rest/v1/order_confirmations',
    headers: Object.assign({}, sbHeaders, { 'Prefer': 'return=minimal' }),
    body:    JSON.stringify({
      schedule_id:          scheduleId,
      user_id:              userId,
      status:               'pending',
      scheduled_order_date: orderDate,
    }),
  });
} catch (e) { /* non-fatal — dedup prevents duplicates */ }

// ── Step 3: Get user email ────────────────────────────────────────────────────
let userEmail = null;
try {
  const userRows = await $helpers.httpRequest({
    method:  'GET',
    url:     SUPABASE_URL + '/rest/v1/users?id=eq.' + encodeURIComponent(userId) + '&select=email&limit=1',
    headers: sbHeaders,
  });
  userEmail = Array.isArray(userRows) && userRows[0] ? userRows[0].email : null;
} catch (e) { userEmail = null; }

if (!userEmail) {
  return [{ json: { ok: false, reason: 'no_email', scheduleId } }];
}

// ── Step 4: Build HMAC-signed confirm/skip links ──────────────────────────────
const confirmToken = signOrderToken(scheduleId, 'confirm');
const skipToken    = signOrderToken(scheduleId, 'skip');
const confirmUrl   = SITE_URL + '/api/orders/confirm/' + scheduleId + '?token=' + encodeURIComponent(confirmToken);
const skipUrl      = SITE_URL + '/api/orders/skip/'    + scheduleId + '?token=' + encodeURIComponent(skipToken);
const schedulesUrl = SITE_URL + '/dashboard/schedules';

const formattedDate = new Date(orderDate + 'T12:00:00Z').toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

// ── Step 5: Build retailer-specific email ────────────────────────────────────
const type = retailerType(retailer);
const { subject, htmlBody, textBody } = buildEmailContent({
  type,
  productName,
  retailer,
  formattedDate,
  confirmUrl,
  skipUrl,
  schedulesUrl,
});

// ── Step 6: Send confirmation email via SendGrid ──────────────────────────────
try {
  await $helpers.httpRequest({
    method:  'POST',
    url:     'https://api.sendgrid.com/v3/mail/send',
    headers: {
      'Authorization': 'Bearer ' + SENDGRID_KEY,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: userEmail }] }],
      from:    { email: 'orders@restox.net', name: 'Restox' },
      subject: subject,
      content: [
        { type: 'text/plain', value: textBody },
        { type: 'text/html',  value: htmlBody },
      ],
    }),
  });
} catch (e) { /* email failure is non-fatal — confirmation row already created */ }

// ── Step 7: Log to notification_log ──────────────────────────────────────────
try {
  await $helpers.httpRequest({
    method:  'POST',
    url:     SUPABASE_URL + '/rest/v1/notification_log',
    headers: Object.assign({}, sbHeaders, { 'Prefer': 'return=minimal' }),
    body:    JSON.stringify({
      user_id:           userId,
      schedule_id:       scheduleId,
      product_name:      productName,
      retailer_name:     retailer,
      notification_type: 'pre_order_confirmation',
      channel:           'email',
      status:            'sent',
    }),
  });
} catch (e) { /* non-fatal */ }

return [{ json: { ok: true, scheduleId, userEmail, orderDate, retailerType: type } }];
