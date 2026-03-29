import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function logAction(action: string, entity_id: string, details?: any) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_email: 'admin',
      action,
      entity_type: 'plan',
      entity_id,
      details: details || null
    })
  } catch (e) {
    console.error('Audit log error:', e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('plans').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const action = body.is_active === false ? 'deactivate' : body.is_active === true ? 'activate' : 'update'
  await logAction(action, id, { name: data.name, ...body })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await supabaseAdmin.from('plans').select('name').eq('id', id).single()
  const { error } = await supabaseAdmin.from('plans').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAction('delete', id, { name: data?.name })
  return NextResponse.json({ success: true })
}
