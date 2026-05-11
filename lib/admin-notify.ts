const ADMIN_EMAIL  = 'asevedge@restox.net'
const FROM_EMAIL   = 'hello@restox.net'
const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send'

async function postSlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

async function sendAdminEmail(subject: string, body: string): Promise<void> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return
  await fetch(SENDGRID_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: ADMIN_EMAIL }] }],
      from: { email: FROM_EMAIL, name: 'Restox Admin' },
      subject,
      content: [{ type: 'text/plain', value: body }],
    }),
  })
}

export type AdminNotifyPayload =
  | { type: 'retailer_request'; userEmail: string; retailerName: string; websiteUrl?: string | null; reason?: string | null }
  | { type: 'waitlist_signup';  email: string; name: string; userType: string }
  | { type: 'feedback';         userEmail: string; category: string; message: string; pageUrl?: string | null }
  | { type: 'new_user';         email: string; totalUsers: number }

export async function notifyAdmin(payload: AdminNotifyPayload): Promise<void> {
  const ts = new Date().toISOString()

  try {
    switch (payload.type) {
      case 'retailer_request': {
        const lines = [
          '🏪 *New retailer request*',
          `User: ${payload.userEmail}`,
          `Retailer: ${payload.retailerName}`,
        ]
        if (payload.websiteUrl) lines.push(`Website: ${payload.websiteUrl}`)
        if (payload.reason)     lines.push(`Notes: ${payload.reason}`)
        lines.push(`Time: ${ts}`)

        const emailBody = [
          `User: ${payload.userEmail}`,
          `Retailer: ${payload.retailerName}`,
          `Website: ${payload.websiteUrl || '(not provided)'}`,
          `Notes: ${payload.reason || '(none)'}`,
          `Time: ${ts}`,
        ].join('\n')

        await Promise.allSettled([
          postSlack(lines.join('\n')),
          sendAdminEmail(`New retailer request — ${payload.retailerName}`, emailBody),
        ])
        break
      }

      case 'waitlist_signup': {
        const text = [
          '📬 *New waitlist signup*',
          `Email: ${payload.email}`,
          `Name: ${payload.name}`,
          `Type: ${payload.userType}`,
          `Time: ${ts}`,
        ].join('\n')
        await postSlack(text).catch(err => console.warn('[admin-notify] slack error:', err))
        break
      }

      case 'feedback': {
        const truncated = payload.message.length > 500
          ? payload.message.slice(0, 500) + '…'
          : payload.message

        const lines = [
          '💬 *New feedback submitted*',
          `User: ${payload.userEmail || 'anonymous'}`,
          `Category: ${payload.category}`,
          `Message: ${truncated}`,
        ]
        if (payload.pageUrl) lines.push(`Page: ${payload.pageUrl}`)
        lines.push(`Time: ${ts}`)

        const emailBody = [
          `User: ${payload.userEmail || 'anonymous'}`,
          `Category: ${payload.category}`,
          '',
          payload.message,
          '',
          `Page: ${payload.pageUrl || '(not provided)'}`,
          `Time: ${ts}`,
        ].join('\n')

        await Promise.allSettled([
          postSlack(lines.join('\n')),
          sendAdminEmail(`New Restox feedback — ${payload.category}`, emailBody),
        ])
        break
      }

      case 'new_user': {
        const text = [
          '🎉 *New user signed up*',
          `Email: ${payload.email}`,
          'Plan: Free',
          `Time: ${ts}`,
          `Total users: ${payload.totalUsers}`,
        ].join('\n')
        await postSlack(text).catch(err => console.warn('[admin-notify] slack error:', err))
        break
      }
    }
  } catch (err) {
    console.error('[admin-notify] error:', err)
  }
}
