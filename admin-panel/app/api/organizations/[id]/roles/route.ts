import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/organizations/[id]/roles
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: roles, error } = await supabaseAdmin
    .from('roles')
    .select('id, name, permissions, created_at')
    .eq('organization_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json([], { status: 200 })
  if (!roles || roles.length === 0) return NextResponse.json([])

  // Get user_roles for each role
  const roleIds = roles.map(r => r.id)
  const { data: userRoles } = await supabaseAdmin
    .from('user_roles')
    .select('role_id, user_id')
    .in('role_id', roleIds)

  // Get user info
  const userIds = [...new Set((userRoles || []).map(ur => ur.user_id))]
  let usersMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)
    if (users) users.forEach(u => { usersMap[u.id] = u })
  }

  const result = roles.map(role => ({
    ...role,
    user_roles: (userRoles || [])
      .filter(ur => ur.role_id === role.id)
      .map(ur => ({ user_id: ur.user_id, users: usersMap[ur.user_id] || null }))
  }))

  return NextResponse.json(result)
}

// POST /api/organizations/[id]/roles
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, permissions } = await req.json()

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('roles')
    .insert({ name, permissions: permissions || {}, organization_id: id })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/organizations/[id]/roles  (body: { role_id, name, permissions })
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { role_id, name, permissions } = await req.json()

  const { data, error } = await supabaseAdmin
    .from('roles')
    .update({ name, permissions })
    .eq('id', role_id)
    .eq('organization_id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/organizations/[id]/roles  (body: { role_id })
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { role_id } = await req.json()

  await supabaseAdmin.from('user_roles').delete().eq('role_id', role_id)
  const { error } = await supabaseAdmin
    .from('roles')
    .delete()
    .eq('id', role_id)
    .eq('organization_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
