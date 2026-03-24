import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: user, error } = await supabaseAdmin
    .from('users').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: memberships } = await supabaseAdmin
    .from('organization_members')
    .select('role, status, joined_at, organizations(id, name)')
    .eq('user_id', id)

  return NextResponse.json({ ...user, memberships: memberships || [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('users').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
