import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('packages').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'update', entity_type: 'package', entity_id: id, organization_id: data.organization_id, details: { name: data.name } })
  return NextResponse.json(data)
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: pkg } = await supabaseAdmin.from('packages').select('organization_id, name').eq('id', id).single()
  const { error } = await supabaseAdmin.from('packages').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'delete', entity_type: 'package', entity_id: id, organization_id: pkg?.organization_id ?? null, details: { name: pkg?.name ?? null } })
  return NextResponse.json({ success: true })
}
