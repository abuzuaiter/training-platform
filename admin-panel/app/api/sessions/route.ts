import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org_id = searchParams.get('org_id')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabaseAdmin
    .from('sessions')
    .select('*, organizations(name), bookings(id, status, customers(full_name))')
    .order('start_time', { ascending: true })

  if (org_id) query = query.eq('organization_id', org_id)
  if (from) query = query.gte('start_time', from)
  if (to) query = query.lte('start_time', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { organization_id, activity_id, title, description, start_time, end_time, capacity } = body

  if (!organization_id || !title || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .insert({
      organization_id,
      activity_id: activity_id || null,
      title,
      description: description || null,
      start_time,
      end_time,
      capacity: capacity || 1,
      status: 'scheduled'
    })
    .select('*, organizations(name)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('audit_logs').insert({
    user_email: 'admin', action: 'create', entity_type: 'session',
    entity_id: data.id, details: { title, organization_id }
  })

  return NextResponse.json(data)
}
