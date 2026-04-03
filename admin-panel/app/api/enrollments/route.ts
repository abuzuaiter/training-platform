import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org_id = searchParams.get('org_id')
  const customer_id = searchParams.get('customer_id')

  let query = supabaseAdmin
    .from('enrollments')
    .select('*, customers(full_name, customer_code, mobile), plans(name, type, sessions_count, absence_policy, enable_notification, price)')
    .order('created_at', { ascending: false })

  if (org_id) query = query.eq('organization_id', org_id)
  if (customer_id) query = query.eq('customer_id', customer_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { customer_id, plan_id, organization_id, start_date } = body

  if (!customer_id || !plan_id || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get plan details
  const { data: plan } = await supabaseAdmin
    .from('plans').select('*').eq('id', plan_id).single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const sessions_remaining = plan.type === 'sessions' ? plan.sessions_count : null

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .insert({
      customer_id, plan_id, organization_id,
      sessions_remaining,
      status: 'active',
      start_date: start_date || new Date().toISOString().split('T')[0]
    })
    .select('*, customers(full_name), plans(name, type, sessions_count)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('audit_logs').insert({
    user_email: 'admin', action: 'create', entity_type: 'enrollment',
    entity_id: data.id, details: { customer_id, plan_id, organization_id }
  })

  return NextResponse.json(data)
}
