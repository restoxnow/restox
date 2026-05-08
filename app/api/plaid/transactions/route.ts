import { NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { decrypt } from '@/lib/encrypt'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { RemovedTransaction, Transaction } from 'plaid'

interface RecurringItem {
  merchant: string
  occurrences: number
  totalSpent: number
  avgAmount: number
  frequency: string
  lastSeen: string
  category: string | null
}

function detectRecurring(transactions: Transaction[]): RecurringItem[] {
  const byMerchant: Record<string, Transaction[]> = {}

  for (const tx of transactions) {
    const key = tx.merchant_name ?? tx.name
    if (!key) continue
    if (!byMerchant[key]) byMerchant[key] = []
    byMerchant[key].push(tx)
  }

  const results: RecurringItem[] = []

  for (const [merchant, txs] of Object.entries(byMerchant)) {
    if (txs.length < 2) continue

    const sorted = txs.sort((a, b) => a.date.localeCompare(b.date))
    const totalSpent = txs.reduce((sum, t) => sum + t.amount, 0)
    const avgAmount = totalSpent / txs.length

    // Estimate frequency from median gap between purchases
    const gaps: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      const a = new Date(sorted[i - 1].date).getTime()
      const b = new Date(sorted[i].date).getTime()
      gaps.push((b - a) / (1000 * 60 * 60 * 24))
    }
    const medianGap = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)]

    let frequency = 'occasional'
    if (medianGap <= 10) frequency = 'weekly'
    else if (medianGap <= 20) frequency = 'bi-weekly'
    else if (medianGap <= 45) frequency = 'monthly'
    else if (medianGap <= 100) frequency = 'quarterly'

    const lastTx = sorted[sorted.length - 1]
    results.push({
      merchant,
      occurrences: txs.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      avgAmount: Math.round(avgAmount * 100) / 100,
      frequency,
      lastSeen: lastTx.date,
      category: lastTx.personal_finance_category?.primary ?? null,
    })
  }

  return results.sort((a, b) => b.occurrences - a.occurrences)
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connections, error: dbError } = await supabase
      .from('plaid_connections')
      .select('access_token, item_id, institution_name')
      .eq('user_id', user.id)

    if (dbError) throw dbError
    if (!connections || connections.length === 0) {
      return NextResponse.json({ recurring: [], connected: false })
    }

    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 24)
    const endDate = new Date()

    const allTransactions: Transaction[] = []

    for (const conn of connections) {
      const accessToken = decrypt(conn.access_token)
      let cursor: string | undefined
      let hasMore = true

      while (hasMore) {
        const params: Parameters<typeof plaidClient.transactionsSync>[0] = {
          access_token: accessToken,
          ...(cursor ? { cursor } : {}),
        }
        const response = await plaidClient.transactionsSync(params)
        const { added, next_cursor, has_more } = response.data

        allTransactions.push(...(added as Transaction[]))
        cursor = next_cursor
        hasMore = has_more
      }
    }

    // Filter to purchases (positive amount = money out) within 24 months
    const startTs = startDate.toISOString().slice(0, 10)
    const purchases = allTransactions.filter(
      tx => tx.amount > 0 && tx.date >= startTs && !tx.pending
    )

    const recurring = detectRecurring(purchases)

    return NextResponse.json({ recurring, connected: true, count: purchases.length })
  } catch (err: any) {
    console.error('Plaid transactions error:', err?.response?.data ?? err)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
