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
    .select('*, users(id, full_name, first_name, last_name, email, phone, mobile)')
    .eq('organization_id', id)
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user_id, email, role, status } = await req.json()

  // If user_id provided, add directly
  if (user_id) {
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .insert({ organization_id: id, user_id, email, role: role || 'coach', status: status || 'active' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // If only email provided, save with email only (user will be linked on signup/login)
  if (email) {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users').select('id').eq('email', email).maybeSingle()

    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: id,
        user_id: existingUser?.id || null,
        email,
        role: role || 'coach',
        status: existingUser ? 'active' : 'pending'
      })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, already_exists: !!existingUser })
  }

  return NextResponse.json({ error: 'Email or user_id required' }, { status: 400 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { member_id, role, status } = await req.json()
  const updateData: any = {}
  if (role) updateData.role = role
  if (status) updateData.status = status
  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .update(updateData)
    .eq('id', member_id)
    .eq('organization_id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
ENDOFFILEcat > "/workspaces/training-platform/admin-panel/app/api/organizations/[id]/members/route.ts" << 'ENDOFFILE'
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
    .select('*, users(id, full_name, first_name, last_name, email, phone, mobile)')
    .eq('organization_id', id)
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user_id, email, role, status } = await req.json()

  // If user_id provided, add directly
  if (user_id) {
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .insert({ organization_id: id, user_id, email, role: role || 'coach', status: status || 'active' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // If only email provided, save with email only (user will be linked on signup/login)
  if (email) {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users').select('id').eq('email', email).maybeSingle()

    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: id,
        user_id: existingUser?.id || null,
        email,
        role: role || 'coach',
        status: existingUser ? 'active' : 'pending'
      })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, already_exists: !!existingUser })
  }

  return NextResponse.json({ error: 'Email or user_id required' }, { status: 400 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { member_id, role, status } = await req.json()
  const updateData: any = {}
  if (role) updateData.role = role
  if (status) updateData.status = status
  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .update(updateData)
    .eq('id', member_id)
    .eq('organization_id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
