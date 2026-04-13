import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const session_id = searchParams.get('session_id')
  const org_id = searchParams.get('org_id')

  let query = supabaseAdmin
    .from('attendance')
    .select('*, customers(full_name, customer_code, mobile), enrollments(id, sessions_remaining, package_id, packages(name, type, absence_policy))')
    .order('created_at', { ascending: true })

  if (session_id) query = query.eq('session_id', session_id)
  if (org_id) query = query.eq('organization_id', org_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { session_id, customer_id, organization_id, enrollment_id, booking_id } = body

  if (!session_id || !customer_id || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if attendance already exists
  const { data: existing } = await supabaseAdmin
    .from('attendance')
    .select('id').eq('session_id', session_id).eq('customer_id', customer_id).maybeSingle()

  if (existing) return NextResponse.json({ error: 'Attendance already recorded' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('attendance')
    .insert({ session_id, customer_id, organization_id, enrollment_id: enrollment_id || null, booking_id: booking_id || null, status: 'pending' })
    .select('*, customers(full_name)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { attendance_records } = body

  if (!attendance_records || !Array.isArray(attendance_records)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const results = []

  for (const record of attendance_records) {
    const { id, status, enrollment_id } = record

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update({ status, marked_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) continue
    results.push(data)

    // If attended and has enrollment with sessions plan — deduct
    if (status === 'attended' && enrollment_id) {
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('*, packages(type, sessions_count, enable_notification, absence_policy)')
        .eq('id', enrollment_id).single()

      if (enrollment && enrollment.packages?.type === 'sessions' && enrollment.sessions_remaining !== null) {
        const newRemaining = Math.max(0, enrollment.sessions_remaining - 1)
        const newStatus = newRemaining === 0 ? 'completed' : 'active'

        await supabaseAdmin.from('enrollments')
          .update({ sessions_remaining: newRemaining, status: newStatus })
          .eq('id', enrollment_id)

        // Notification check (2 sessions remaining)
        if (enrollment.packages?.enable_notification && newRemaining <= 2 && newRemaining > 0) {
          await supabaseAdmin.from('audit_logs').insert({
            user_email: 'system', action: 'notification', entity_type: 'enrollment',
            entity_id: enrollment_id,
            details: { message: `Customer has ${newRemaining} session(s) remaining`, sessions_remaining: newRemaining }
          })
        }
      }
    }

    // If rescheduled and absence_policy is reschedule — don't deduct
    if (status === 'rescheduled' && enrollment_id) {
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments').select('*, plans(absence_policy)').eq('id', enrollment_id).single()

      if (enrollment?.plans?.absence_policy === 'deduct') {
        const newRemaining = Math.max(0, (enrollment.sessions_remaining || 1) - 1)
        await supabaseAdmin.from('enrollments')
          .update({ sessions_remaining: newRemaining })
          .eq('id', enrollment_id)
      }
    }
  }

  return NextResponse.json({ success: true, updated: results.length })
}
