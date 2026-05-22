import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { org_id } = await req.json()
  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  // Fetch all sessions with their bookings
  const { data: sessions, error } = await supabase
    .from('calendar_sessions')
    .select('id, title, start_time, organization_id, calendar_bookings(id, customer_id, enrollment_id, status)')
    .eq('organization_id', org_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!sessions || sessions.length === 0) return NextResponse.json({ merged: 0 })

  // Group sessions by title + start_time (exact duplicates)
  const groups: Record<string, any[]> = {}
  for (const s of sessions) {
    const key = `${s.title}__${s.start_time}`
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }

  let mergedGroups = 0
  let movedBookings = 0
  let deletedSessions = 0

  for (const [, group] of Object.entries(groups)) {
    if (group.length <= 1) continue // no duplicates

    // Keep the first (oldest) session, merge the rest into it
    const [primary, ...duplicates] = group

    for (const dup of duplicates) {
      const bookings: any[] = dup.calendar_bookings || []

      for (const booking of bookings) {
        // Skip if this customer is already booked in the primary session
        const alreadyIn = (primary.calendar_bookings || []).some(
          (b: any) => b.customer_id === booking.customer_id
        )
        if (!alreadyIn) {
          // Move booking to primary session
          await supabase
            .from('calendar_bookings')
            .update({ session_id: primary.id })
            .eq('id', booking.id)

          // Add to primary's local list so next iteration is accurate
          primary.calendar_bookings.push({ ...booking, session_id: primary.id })
          movedBookings++
        } else {
          // Duplicate booking — just delete it
          await supabase.from('calendar_bookings').delete().eq('id', booking.id)
        }
      }

      // Delete the duplicate session
      await supabase.from('calendar_sessions').delete().eq('id', dup.id)
      deletedSessions++
    }

    // Recalculate booked_count for the primary session
    const { count } = await supabase
      .from('calendar_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', primary.id)

    await supabase
      .from('calendar_sessions')
      .update({ booked_count: count ?? 0 })
      .eq('id', primary.id)

    mergedGroups++
  }

  return NextResponse.json({
    merged: mergedGroups,
    movedBookings,
    deletedSessions,
    message: mergedGroups > 0
      ? `Merged ${mergedGroups} duplicate group(s) — moved ${movedBookings} booking(s), removed ${deletedSessions} duplicate session(s)`
      : 'No duplicate sessions found'
  })
}
