import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { session_id, customer_id, organization_id, notes, enrollment_id } = await req.json()

  if (!session_id || !customer_id || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: session } = await supabaseAdmin
    .from('calendar_sessions').select('capacity, booked_count').eq('id', session_id).single()

  if (session && session.booked_count >= session.capacity) {
    return NextResponse.json({ error: 'Session is full' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('calendar_bookings')
    .insert({ session_id, customer_id, organization_id, notes: notes || null, enrollment_id: enrollment_id || null, status: 'confirmed' })
    .select('*, customers(full_name)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('calendar_sessions')
    .update({ booked_count: (session?.booked_count || 0) + 1 })
    .eq('id', session_id)

  return NextResponse.json(data)
}
