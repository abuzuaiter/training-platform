import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data: orgs, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!orgs || orgs.length === 0) return NextResponse.json([])

  // Manual join for account managers
  const managerIds = orgs.filter(o => o.account_manager_id).map(o => o.account_manager_id)
  let managersMap: Record<string, any> = {}

  if (managerIds.length > 0) {
    const { data: managers } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .in('id', managerIds)
    if (managers) managers.forEach(m => { managersMap[m.id] = m })
  }

  const result = orgs.map(o => ({
    ...o,
    account_manager: o.account_manager_id ? managersMap[o.account_manager_id] || null : null
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, name_ar, email, phone, mobile, admin_email, category, account_manager_id } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .insert({ name, name_ar, email, phone, mobile, category, account_manager_id: account_manager_id || null, status: 'active' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create admin member if admin_email provided
  if (admin_email && org) {
    const { data: user } = await supabaseAdmin
      .from('users').select('id').eq('email', admin_email).maybeSingle()
    if (user) {
      await supabaseAdmin.from('organization_members').insert({
        organization_id: org.id, user_id: user.id, email: admin_email, role: 'admin', status: 'active'
      })
    } else {
      await supabaseAdmin.from('organization_members').insert({
        organization_id: org.id, email: admin_email, role: 'admin', status: 'pending'
      })
    }
  }

  return NextResponse.json(org)
}
