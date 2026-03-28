import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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
  const { plan_id, start_date, end_date, payment_status, notes } = await req.json()

  if (!plan_id || !start_date || !end_date) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const { data: plan } = await supabaseAdmin.from('plans').select('max_customers').eq('id', plan_id).single()
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

  const { data, error } = await supabaseAdmin.from('organization_plans').insert({
    organization_id: id, plan_id, start_date, end_date,
    payment_status: payment_status || 'unpaid',
    notes: notes || null
  }).select('*, plans(*)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
