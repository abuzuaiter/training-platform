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
    .from('calendar_sessions')
    .select('*, organizations(name), calendar_bookings(id, status, enrollment_id, customer_id, customers(full_name))')
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
  const {
    organization_id, activity_id, title, description,
    start_time, end_time, capacity,
    is_recurring, recurrence_type, recurrence_days, recurrence_end_date
  } = body

  if (!organization_id || !title || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: session, error } = await supabaseAdmin
    .from('calendar_sessions')
    .insert({
      organization_id,
      activity_id: activity_id || null,
      title,
      description: description || null,
      start_time,
      end_time,
      capacity: capacity || 1,
      status: 'scheduled',
      is_recurring: is_recurring || false,
      recurrence_type: recurrence_type || null,
      recurrence_days: recurrence_days || null,
      recurrence_end_date: recurrence_end_date || null,
    })
    .select('*, organizations(name)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Generate recurring sessions
  const effectiveEndDate = recurrence_end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  if (is_recurring && recurrence_type) {
    const sessions = []
    const start = new Date(start_time)
    const end = new Date(end_time)
    const endDate = new Date(effectiveEndDate)
    const duration = end.getTime() - start.getTime()
    let current = new Date(start)

    // Start from next day
    current.setDate(current.getDate() + 1)

    while (current <= endDate) {
      const dayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][current.getDay()]

      let shouldAdd = false

      if (recurrence_type === 'daily') {
        shouldAdd = true
      } else if (recurrence_type === 'weekly') {
        if (recurrence_days && recurrence_days.length > 0) {
          shouldAdd = recurrence_days.includes(dayName)
        } else {
          // Same day each week
          shouldAdd = current.getDay() === start.getDay()
        }
      } else if (recurrence_type === 'monthly') {
        shouldAdd = current.getDate() === start.getDate()
      }

      if (shouldAdd) {
        // Keep same time, just change the date
        const sessionStart = new Date(current)
        sessionStart.setHours(start.getHours(), start.getMinutes(), 0, 0)
        const sessionEnd = new Date(sessionStart.getTime() + duration)

        sessions.push({
          organization_id, activity_id: activity_id || null,
          title, description: description || null,
          start_time: sessionStart.toISOString(),
          end_time: sessionEnd.toISOString(),
          capacity: capacity || 1, status: 'scheduled',
          is_recurring: true, recurrence_type,
          parent_session_id: session.id,
        })
      }

      current.setDate(current.getDate() + 1)
    }

    if (sessions.length > 0) {
      await supabaseAdmin.from('calendar_sessions').insert(sessions)
    }
  }

  await supabaseAdmin.from('audit_logs').insert({
    user_email: 'admin', action: 'create', entity_type: 'calendar_session',
    entity_id: session.id, details: { title, organization_id, is_recurring }
  })

  return NextResponse.json(session)
}
