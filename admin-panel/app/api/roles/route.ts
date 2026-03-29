import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('roles').select('*, user_roles(user_id, users(full_name, email))')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, permissions } = body
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('roles').insert({ name, permissions: permissions || {} }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabaseAdmin.from('audit_logs').insert({
    user_email: 'admin', action: 'create', entity_type: 'role',
    entity_id: data.id, details: { name }
  })
  return NextResponse.json(data)
}
