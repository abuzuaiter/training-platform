import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: members, error } = await supabaseAdmin
    .from('organization_members')
    .select('*')
    .eq('organization_id', id)

  if (error) return NextResponse.json([], { status: 200 })
  if (!members || members.length === 0) return NextResponse.json([])

  // Manual join with users table
  const userIds = members.filter(m => m.user_id).map(m => m.user_id)
  let usersMap: Record<string, any> = {}

  if (userIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, full_name, first_name, last_name, email, mobile')
      .in('id', userIds)

    if (users) {
      users.forEach(u => { usersMap[u.id] = u })
    }
  }

  const result = members.map(m => ({
    ...m,
    users: m.user_id ? usersMap[m.user_id] || null : null
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user_id, email, role, status, allowed_pages } = await req.json()

  if (email) {
    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', id)
      .eq('email', email)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: 'This email is already a member' }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users').select('id').eq('email', email).maybeSingle()

    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: id,
        user_id: existingUser?.id || null,
        email,
        role: role || 'coach',
        status: existingUser ? 'active' : 'pending',
        allowed_pages: allowed_pages || null
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logAudit({ action: 'create', entity_type: 'member', entity_id: data.id, organization_id: id, details: { email, role: data.role } })
    return NextResponse.json({ ...data, already_exists: !!existingUser })
  }

  if (user_id) {
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .insert({ organization_id: id, user_id, email, role: role || 'coach', status: status || 'active' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logAudit({ action: 'create', entity_type: 'member', entity_id: data.id, organization_id: id, details: { email, role: data.role } })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Email required' }, { status: 400 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { member_id, role, status, allowed_pages } = await req.json()
  const updateData: any = {}
  if (role) updateData.role = role
  if (status !== undefined) updateData.status = status
  if (allowed_pages !== undefined) updateData.allowed_pages = allowed_pages
  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .update(updateData)
    .eq('id', member_id)
    .eq('organization_id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'update', entity_type: 'member', entity_id: member_id, organization_id: id, details: { role: data.role, status: data.status } })
  return NextResponse.json(data)
}
