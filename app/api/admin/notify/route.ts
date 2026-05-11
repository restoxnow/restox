import { NextRequest, NextResponse } from 'next/server'
import { notifyAdmin, type AdminNotifyPayload } from '@/lib/admin-notify'

export async function POST(req: NextRequest) {
  try {
    const payload: AdminNotifyPayload = await req.json()
    if (!payload?.type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 })
    }
    // Fire-and-forget — never block the user action
    notifyAdmin(payload).catch(err => console.error('[admin/notify]', err))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
