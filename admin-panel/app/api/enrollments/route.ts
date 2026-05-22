import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org_id = searchParams.get('org_id')
  const customer_id = searchParams.get('customer_id')
  let query = supabaseAdmin.from('enrollments')
    .select('*, customers(full_name, customer_code, mobile), packages(name, price, sessions_count, absence_policy, enable_notification, capacity)')
    .order('created_at', { ascending: false })
  if (org_id) query = query.eq('organization_id', org_id)
  if (customer_id) query = query.eq('customer_id', customer_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { customer_id, package_id, session_id, organization_id, start_date, payment_status, paid_at, sessions_attended, status } = body
  const sessionsRem = body.sessions_remaining

  if (!customer_id || !package_id || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('enrollments').insert({
    customer_id,
    package_id,
    session_id: session_id || null,
    organization_id,
    start_date: start_date || new Date().toISOString().split('T')[0],
    payment_status: payment_status || 'pending',
    paid_at: paid_at || null,
    sessions_remaining: sessionsRem || null,
    sessions_attended: sessions_attended || 0,
    status: status || 'active'
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create calendar_bookings for all upcoming sessions in this series
  if (session_id) {
    const now = new Date().toISOString()

    // Get the parent session to find all siblings
    const { data: parentSession } = await supabaseAdmin
      .from('calendar_sessions')
      .select('id, parent_session_id')
      .eq('id', session_id)
      .single()

    const rootId = parentSession?.parent_session_id || session_id

    // Get all sessions in this series (the root + all children) that are upcoming
    const { data: seriesSessions } = await supabaseAdmin
      .from('calendar_sessions')
      .select('id')
      .or(`id.eq.${rootId},parent_session_id.eq.${rootId}`)
      .gte('start_time', now)
      .eq('organization_id', organization_id)

    if (seriesSessions && seriesSessions.length > 0) {
      // Don't duplicate — skip sessions already booked by this customer
      const { data: existingBookings } = await supabaseAdmin
        .from('calendar_bookings')
        .select('session_id')
        .eq('customer_id', customer_id)
        .in('session_id', seriesSessions.map((s: any) => s.id))

      const alreadyBooked = new Set((existingBookings || []).map((b: any) => b.session_id))

      const newBookings = seriesSessions
        .filter((s: any) => !alreadyBooked.has(s.id))
        .map((s: any) => ({
          session_id: s.id,
          customer_id,
          organization_id,
          enrollment_id: data.id,
          status: 'confirmed',
        }))

      if (newBookings.length > 0) {
        await supabaseAdmin.from('calendar_bookings').insert(newBookings)
      }
    }
  }

  await logAudit({ action: 'create', entity_type: 'enrollment', entity_id: data.id, organization_id: data.organization_id, details: { customer_id: data.customer_id, package_id: data.package_id } })
  return NextResponse.json(data)
}
