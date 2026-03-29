import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
async function logAction(supabase: any, action: string, entity_type: string, entity_id?: string, details?: any) {
  try {
    await supabase.from('audit_logs').insert({
      user_email: 'admin', action, entity_type,
      entity_id: entity_id || null, details: details || null
    })
  } catch (e) {}
}


export async function GET(_: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const { data, error } = await supabaseAdmin
    .from('customer_subscriptions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const body = await req.json()
  const { organization_id, subscription_type, price, start_date, end_date, payment_status, notes } = body

  if (!subscription_type || !price || !start_date || !end_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('customer_subscriptions')
    .insert({
      customer_id: customerId,
      organization_id,
      subscription_type,
      price,
      start_date,
      end_date,
      payment_status: payment_status || 'unpaid',
      notes: notes || null
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAction(supabaseAdmin, 'create', 'subscription', data.id, { customer: customerId, type: subscription_type, price })
  return NextResponse.json(data)
}