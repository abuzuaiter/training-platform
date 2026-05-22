import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('session_templates').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'update', entity_type: 'session_template', entity_id: id, organization_id: data.organization_id, details: { title: data.title } })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fetch template info for audit before deleting
  const { data: tmpl } = await supabaseAdmin.from('session_templates').select('organization_id, title').eq('id', id).single()

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
      .eq('organization_id', tmpl?.organization_id)
    if (sessions) {
      await supabaseAdmin.from('calendar_sessions').delete().in('id', sessions.map((s: any) => s.id))
    }
  }

  const { error } = await supabaseAdmin.from('session_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'delete', entity_type: 'session_template', entity_id: id, organization_id: tmpl?.organization_id ?? null, details: { title: tmpl?.title ?? null } })
  return NextResponse.json({ success: true })
}
