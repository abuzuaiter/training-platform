import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .select('id, role, status, joined_at, user_id')
    .eq('organization_id', id)
    .order('joined_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const members = await Promise.all((data || []).map(async (m) => {
    const { data: user } = await supabaseAdmin
      .from('users').select('full_name, email, mobile').eq('id', m.user_id).single()
    return { ...m, user }
  }))

  return NextResponse.json(members)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { email, role } = await req.json()

  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!role) return NextResponse.json({ error: 'Role is required' }, { status: 400 })

  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('email', email).single()

  if (!user) return NextResponse.json({ error: 'User not found — must register first' }, { status: 404 })

  // Check if member already exists
  const { data: existing } = await supabaseAdmin
    .from('organization_members')
    .select('id, role')
    .eq('organization_id', id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ 
      error: `User already exists as ${existing.role} in this organization` 
    }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('organization_members').insert({
    organization_id: id,
    user_id: user.id,
    role,
    status: 'active',
    joined_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user_id } = await req.json()

  const { error } = await supabaseAdmin
    .from('organization_members')
    .delete()
    .eq('organization_id', id)
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
