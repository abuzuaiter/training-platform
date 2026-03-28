import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { stats } = body

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a business analyst for "Mawid" - a SaaS appointment management platform in Qatar. Analyze this data and give 3-4 actionable insights in Arabic. Be concise and specific.

Data:
- Active Organizations: ${stats.totalOrgs}
- Total Customers: ${stats.totalCustomers}
- Active Plans: ${stats.activeOrgPlans}
- Expired Plans: ${stats.expiredOrgPlans}
- Plans expiring in 7 days: ${stats.expiringOrgPlans}
- Total Revenue: ${stats.totalRevenue} QAR
- Pending Revenue: ${stats.pendingRevenue} QAR
- This Month Revenue: ${stats.thisMonthRevenue} QAR
- Orgs renewed this month: ${stats.renewedOrgs?.length || 0}
- Orgs not renewed: ${stats.notRenewedOrgs?.length || 0}
- Active customer subscriptions: ${stats.renewedCustomers?.length || 0}
- Expired customer subscriptions: ${stats.notRenewedCustomers?.length || 0}

Give insights as numbered list in Arabic. Focus on: revenue opportunities, churn risk, and growth recommendations.`
      }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || 'لا توجد رؤى متاحة'
  return NextResponse.json({ insight: text })
}
