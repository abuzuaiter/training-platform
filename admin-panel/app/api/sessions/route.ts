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
  const {
    organization_id, activity_id, title, description,
    start_time, end_time, capacity,
    is_recurring, recurrence_type, recurrence_days, recurrence_end_date
  } = body

  if (!organization_id || !title || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create the first/main session
  const { data: session, error } = await supabaseAdmin
    .from('sessions')
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
      session_date: new Date(start_time).toISOString().split('T')[0]
    })
    .select('*, organizations(name)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Generate recurring sessions
  if (is_recurring && recurrence_type && recurrence_end_date) {
    const sessions = []
    const start = new Date(start_time)
    const end = new Date(end_time)
    const endDate = new Date(recurrence_end_date)
    const duration = end.getTime() - start.getTime()

    let current = new Date(start)

    // Move to next occurrence
    if (recurrence_type === 'daily') current.setDate(current.getDate() + 1)
    else if (recurrence_type === 'weekly') current.setDate(current.getDate() + 7)
    else if (recurrence_type === 'monthly') current.setMonth(current.getMonth() + 1)

    while (current <= endDate) {
      const dayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][current.getDay()]

      // For weekly, check if this day is in recurrence_days
      if (recurrence_type === 'weekly' && recurrence_days && recurrence_days.length > 0) {
        if (recurrence_days.includes(dayName)) {
          const sessionEnd = new Date(current.getTime() + duration)
          sessions.push({
            organization_id,
            activity_id: activity_id || null,
            title,
            description: description || null,
            start_time: current.toISOString(),
            end_time: sessionEnd.toISOString(),
            capacity: capacity || 1,
            status: 'scheduled',
            is_recurring: true,
            recurrence_type,
            parent_session_id: session.id,
            session_date: current.toISOString().split('T')[0]
          })
        }
      } else {
        const sessionEnd = new Date(current.getTime() + duration)
        sessions.push({
          organization_id,
          activity_id: activity_id || null,
          title,
          description: description || null,
          start_time: current.toISOString(),
          end_time: sessionEnd.toISOString(),
          capacity: capacity || 1,
          status: 'scheduled',
          is_recurring: true,
          recurrence_type,
          parent_session_id: session.id,
          session_date: current.toISOString().split('T')[0]
        })
      }

      if (recurrence_type === 'daily') current.setDate(current.getDate() + 1)
      else if (recurrence_type === 'weekly') current.setDate(current.getDate() + 7)
      else if (recurrence_type === 'monthly') current.setMonth(current.getMonth() + 1)
    }

    if (sessions.length > 0) {
      await supabaseAdmin.from('sessions').insert(sessions)
    }
  }

  await supabaseAdmin.from('audit_logs').insert({
    user_email: 'admin', action: 'create', entity_type: 'session',
    entity_id: session.id, details: { title, organization_id, is_recurring }
  })

  return NextResponse.json(session)
}
