import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function logAction(action: string, entity_id: string, details?: any) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_email: 'admin', action, entity_type: 'customer', entity_id, details: details || null
    })
  } catch (e) {}
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*, customer_organizations(organization_id)')
    .eq('id', customerId)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('customers').update(body).eq('id', customerId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAction('update', customerId, body)
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const { error } = await supabaseAdmin.from('customers').delete().eq('id', customerId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAction('delete', customerId, {})
  return NextResponse.json({ success: true })
}