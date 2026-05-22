import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const org_id = req.nextUrl.searchParams.get('org_id')
  const status  = req.nextUrl.searchParams.get('status') // optional filter

  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  let query = supabaseAdmin
    .from('reschedule_requests')
    .select(`
      id, enrollment_id, customer_id, organization_id,
      session_date, session_title, preferred_date, note,
      status, admin_note, created_at,
      customers(id, full_name, email),
      enrollments(id, packages(name))
    `)
    .eq('organization_id', org_id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
