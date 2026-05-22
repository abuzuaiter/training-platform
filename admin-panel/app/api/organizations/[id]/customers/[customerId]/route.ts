import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const { data, error } = await supabaseAdmin.from('customers').select('*').eq('id', customerId).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; customerId: string }> }) {
  const { id, customerId } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('customers').update(body).eq('id', customerId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'update', entity_type: 'customer', entity_id: customerId, organization_id: id, details: { name: data.full_name } })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; customerId: string }> }) {
  const { id, customerId } = await params
  const { data: cust } = await supabaseAdmin.from('customers').select('full_name').eq('id', customerId).single()
  const { error } = await supabaseAdmin.from('customers').delete().eq('id', customerId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'delete', entity_type: 'customer', entity_id: customerId, organization_id: id, details: { name: cust?.full_name ?? null } })
  return NextResponse.json({ success: true })
}