import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const enrollment_id = searchParams.get('enrollment_id')
  const org_id = searchParams.get('org_id')

  let query = supabaseAdmin.from('attendance')
    .select('*, enrollments(id, customer_id, customers(full_name))')

  if (enrollment_id) query = query.eq('enrollment_id', enrollment_id)

  const { data, error } = await query.order('session_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { enrollment_id, session_date, attended } = body

  if (!enrollment_id || !session_date) {
    return NextResponse.json({ error: 'enrollment_id and session_date are required' }, { status: 400 })
  }

  // Check if already exists
  const { data: existing } = await supabaseAdmin
    .from('attendance')
    .select('id, attended')
    .eq('enrollment_id', enrollment_id)
    .eq('session_date', session_date)
    .maybeSingle()

  const prevAttended = existing?.attended || false

  if (existing) {
    // Update existing
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update({ attended })
      .eq('id', existing.id)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Adjust sessions if changed
    if (prevAttended !== attended) {
      await adjustSessions(enrollment_id, attended)
    }

    return NextResponse.json(data)
  }

  // Create new
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .insert({ enrollment_id, session_date, attended: attended || false })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (attended) {
    await adjustSessions(enrollment_id, true)
  }

  return NextResponse.json(data)
}

async function adjustSessions(enrollment_id: string, attended: boolean) {
  const { data: enr } = await supabaseAdmin
    .from('enrollments')
    .select('sessions_attended, sessions_remaining, packages(sessions_count, enable_notification)')
    .eq('id', enrollment_id).single()

  if (!enr) return

  const total = enr.packages?.sessions_count || 0
  const change = attended ? 1 : -1
  const newAttended = Math.max(0, (enr.sessions_attended || 0) + change)
  const newRemaining = Math.max(0, total - newAttended)
  const newStatus = newRemaining === 0 ? 'completed' : 'active'

  await supabaseAdmin.from('enrollments')
    .update({ sessions_attended: newAttended, sessions_remaining: newRemaining, status: newStatus })
    .eq('id', enrollment_id)

  if (attended && enr.packages?.enable_notification && newRemaining <= 2 && newRemaining > 0) {
    await supabaseAdmin.from('audit_logs').insert({
      user_email: 'system', action: 'notification', entity_type: 'enrollment',
      entity_id: enrollment_id,
      details: { message: `${newRemaining} session(s) remaining` }
    })
  }
}
