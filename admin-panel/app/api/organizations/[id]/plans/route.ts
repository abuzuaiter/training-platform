import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'


async function logAction(supabase: any, action: string, entity_type: string, entity_id?: string, details?: any) {
  try {
    await supabase.from('audit_logs').insert({
      user_email: 'admin',
      action,
      entity_type,
      entity_id: entity_id || null,
      details: details || null
    })
  } catch (e) {
    console.error('Audit log error:', e)
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('organization_plans')
    .select('*, plans(*)')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { plan_id, billing_cycle, start_date, payment_status, notes } = await req.json()

  if (!plan_id) return NextResponse.json({ error: 'Plan is required' }, { status: 400 })

  const { data: plan } = await supabaseAdmin.from('plans').select('*').eq('id', plan_id).single()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { count } = await supabaseAdmin
    .from('customer_organizations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)

  if ((count || 0) > plan.max_customers) {
    return NextResponse.json({
      error: `This organization has ${count} customers which exceeds the plan limit of ${plan.max_customers}`
    }, { status: 400 })
  }

  const cycle = billing_cycle || plan.billing_cycle || 'monthly'
  const start = start_date ? new Date(start_date) : new Date()
  const end = new Date(start)

  if (cycle === 'monthly') end.setMonth(end.getMonth() + 1)
  else if (cycle === 'quarterly') end.setMonth(end.getMonth() + 3)
  else if (cycle === 'annual') end.setFullYear(end.getFullYear() + 1)

  const { data: orgPlan, error } = await supabaseAdmin.from('organization_plans').insert({
    organization_id: id, plan_id,
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    billing_cycle: cycle,
    payment_status: 'unpaid',
    notes: notes || null
  }).select('*, plans(*)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create invoice only — no email
  const { data: seqData } = await supabaseAdmin.rpc('nextval_invoice')
  const invoiceNumber = 'INV-' + String(seqData || Date.now()).padStart(6, '0')
  const discount = plan.discount_percentage || 0
  const amount = plan.price * (1 - discount / 100)

  await supabaseAdmin.from('invoices').insert({
    invoice_number: invoiceNumber,
    organization_id: id,
    organization_plan_id: orgPlan.id,
    amount,
    type: 'invoice',
    status: 'pending',
    notes: 'Plan: ' + plan.name + ' - Cycle: ' + cycle
  })

  await logAction(supabaseAdmin, 'assign', 'organization_plan', orgPlan.id, { plan: plan.name, org: id, cycle })
  return NextResponse.json(orgPlan)
}
