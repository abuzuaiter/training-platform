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

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('plans').select('*').order('price', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, max_customers, max_staff, price, discount_percentage, billing_cycle } = body
  if (!name || !max_customers || !price) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('plans').insert({
    name, description: description || null,
    max_customers: parseInt(max_customers),
    max_staff: max_staff ? parseInt(max_staff) : 10,
    price: parseFloat(price),
    discount_percentage: discount_percentage ? parseFloat(discount_percentage) : 0,
    billing_cycle: billing_cycle || 'monthly'
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAction(supabaseAdmin, 'create', 'plan', data.id, { name: data.name, max_customers: data.max_customers, price: data.price })
  return NextResponse.json(data)
}
