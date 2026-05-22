import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select('*, customers(full_name, customer_code, mobile), plans(name, type, sessions_count, absence_policy, enable_notification, price)')
    .eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('enrollments').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'update', entity_type: 'enrollment', entity_id: id, organization_id: data.organization_id, details: { status: data.status, payment_status: data.payment_status } })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: enr } = await supabaseAdmin.from('enrollments').select('organization_id, customer_id').eq('id', id).single()
  const { error } = await supabaseAdmin.from('enrollments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'delete', entity_type: 'enrollment', entity_id: id, organization_id: enr?.organization_id ?? null, details: { customer_id: enr?.customer_id ?? null } })
  return NextResponse.json({ success: true })
}
