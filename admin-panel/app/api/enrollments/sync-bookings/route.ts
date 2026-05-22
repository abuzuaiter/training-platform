import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { org_id } = await req.json()
  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const now = new Date().toISOString()

  // 1. Get all active enrollments with a session_id
  const { data: enrollments, error: enrErr } = await supabaseAdmin
    .from('enrollments')
    .select('id, customer_id, session_id, organization_id')
    .eq('organization_id', org_id)
    .eq('status', 'active')
    .not('session_id', 'is', null)

  if (enrErr) return NextResponse.json({ error: enrErr.message }, { status: 500 })
  if (!enrollments || enrollments.length === 0)
    return NextResponse.json({ synced: 0, message: 'No active enrollments with sessions' })

  let totalCreated = 0

  for (const enr of enrollments) {
    // Find root session id
    const { data: parentSession } = await supabaseAdmin
      .from('calendar_sessions')
      .select('id, parent_session_id')
      .eq('id', enr.session_id)
      .single()

    if (!parentSession) continue

    const rootId = parentSession.parent_session_id || enr.session_id

    // Get all upcoming sessions in this series
    const { data: seriesSessions } = await supabaseAdmin
      .from('calendar_sessions')
      .select('id')
      .or(`id.eq.${rootId},parent_session_id.eq.${rootId}`)
      .gte('start_time', now)
      .eq('organization_id', org_id)

    if (!seriesSessions || seriesSessions.length === 0) continue

    // Find which ones already have a booking for this customer
    const { data: existing } = await supabaseAdmin
      .from('calendar_bookings')
      .select('session_id')
      .eq('customer_id', enr.customer_id)
      .in('session_id', seriesSessions.map((s: any) => s.id))

    const alreadyBooked = new Set((existing || []).map((b: any) => b.session_id))

    const newBookings = seriesSessions
      .filter((s: any) => !alreadyBooked.has(s.id))
      .map((s: any) => ({
        session_id: s.id,
        customer_id: enr.customer_id,
        organization_id: org_id,
        enrollment_id: enr.id,
        status: 'confirmed',
      }))

    if (newBookings.length > 0) {
      await supabaseAdmin.from('calendar_bookings').insert(newBookings)
      totalCreated += newBookings.length
    }
  }

  return NextResponse.json({
    synced: totalCreated,
    message: totalCreated > 0
      ? `Created ${totalCreated} booking(s) for existing enrollments`
      : 'All enrollments are already synced'
  })
}
