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
    .select('*, users(id, full_name, email, phone)')
    .eq('organization_id', id)
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { user_id, role } = body

  if (!user_id || !role) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  // Check staff limit if role is not trainee or parent
  const staffRoles = ['admin', 'coach', 'receptionist']
  if (staffRoles.includes(role)) {
    const { count: staffCount } = await supabaseAdmin
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .in('role', staffRoles)

    const { data: activePlan } = await supabaseAdmin
      .from('organization_plans')
      .select('*, plans(max_staff, name)')
      .eq('organization_id', id)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activePlan?.plans?.max_staff !== undefined) {
      const limit = activePlan.plans.max_staff
      const current = staffCount || 0
      if (current >= limit) {
        return NextResponse.json({
          error: `Staff limit reached (${current}/${limit}). Please upgrade your plan "${activePlan.plans.name}" to add more staff.`
        }, { status: 400 })
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .insert({ organization_id: id, user_id, role })
    .select('*, users(id, full_name, email)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
