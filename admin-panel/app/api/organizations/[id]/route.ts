import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function logAction(action: string, entity_id: string, details?: any) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_email: 'admin', action, entity_type: 'organization', entity_id, details: details || null
    })
  } catch (e) {}
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: org, error } = await supabaseAdmin
    .from('organizations').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: adminMember } = await supabaseAdmin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', id)
    .eq('role', 'admin')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  let admin = null
  if (adminMember?.user_id) {
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('id', adminMember.user_id)
      .single()
    admin = adminUser
  }

  return NextResponse.json({ ...org, admin })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('organizations').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('organizations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
