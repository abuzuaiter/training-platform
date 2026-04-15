import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('session_templates').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Get all enrollments using this session template
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments').select('id').eq('session_id', id)
  
  if (enrollments && enrollments.length > 0) {
    const enrollmentIds = enrollments.map((e: any) => e.id)
    // Delete calendar bookings for these enrollments
    await supabaseAdmin.from('calendar_bookings').delete().in('enrollment_id', enrollmentIds)
    // Delete calendar sessions linked to these bookings
    // Get session ids first
    const { data: sessions } = await supabaseAdmin
      .from('calendar_sessions')
      .select('id')
      .eq('organization_id', (await supabaseAdmin.from('session_templates').select('organization_id').eq('id', id).single()).data?.organization_id)
    if (sessions) {
      await supabaseAdmin.from('calendar_sessions').delete().in('id', sessions.map((s: any) => s.id))
    }
  }

  const { error } = await supabaseAdmin.from('session_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
