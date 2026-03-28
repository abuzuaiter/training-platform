import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [
    { count: totalOrgs },
    { count: totalCustomers },
    { count: activeOrgPlans },
    { count: expiredOrgPlans },
    { count: expiringOrgPlans },
    { data: paidInvoices },
    { data: pendingInvoices },
    { data: monthlyRevenue },
    { data: renewedOrgs },
    { data: notRenewedOrgs },
    { data: renewedCustomers },
    { data: notRenewedCustomers },
  ] = await Promise.all([
    supabaseAdmin.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('organization_plans').select('*', { count: 'exact', head: true }).gte('end_date', today),
    supabaseAdmin.from('organization_plans').select('*', { count: 'exact', head: true }).lt('end_date', today),
    supabaseAdmin.from('organization_plans').select('*', { count: 'exact', head: true }).gte('end_date', today).lte('end_date', in7Days),
    supabaseAdmin.from('invoices').select('amount').eq('status', 'paid'),
    supabaseAdmin.from('invoices').select('amount').eq('status', 'pending'),
    supabaseAdmin.from('invoices').select('amount').eq('status', 'paid').gte('paid_at', thisMonthStart),
    supabaseAdmin.from('organization_plans').select('organization_id, organizations(name)').gte('start_date', thisMonthStart).gte('end_date', today),
    supabaseAdmin.from('organization_plans').select('organization_id, organizations(name)').lt('end_date', today),
    supabaseAdmin.from('customer_subscriptions').select('customer_id, customers(full_name)').gte('end_date', today),
    supabaseAdmin.from('customer_subscriptions').select('customer_id, customers(full_name)').lt('end_date', today),
  ])

  const totalRevenue = (paidInvoices || []).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0)
  const pendingRevenue = (pendingInvoices || []).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0)
  const thisMonthRevenue = (monthlyRevenue || []).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0)

  return NextResponse.json({
    totalOrgs: totalOrgs || 0,
    totalCustomers: totalCustomers || 0,
    activeOrgPlans: activeOrgPlans || 0,
    expiredOrgPlans: expiredOrgPlans || 0,
    expiringOrgPlans: expiringOrgPlans || 0,
    totalRevenue,
    pendingRevenue,
    thisMonthRevenue,
    renewedOrgs: renewedOrgs || [],
    notRenewedOrgs: notRenewedOrgs || [],
    renewedCustomers: renewedCustomers || [],
    notRenewedCustomers: notRenewedCustomers || [],
  })
}
