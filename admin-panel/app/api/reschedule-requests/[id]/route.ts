import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status, admin_note } = await req.json()
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Get admin email from session cookie
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  const adminEmail = session ? (JSON.parse(session).email ?? 'admin') : 'admin'

  const { data, error } = await supabaseAdmin
    .from('reschedule_requests')
    .update({ status, admin_note: admin_note ?? null })
    .eq('id', id)
    .select(`
      id, session_title, session_date, preferred_date,
      customer_id, organization_id,
      customers(full_name, email)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Write audit log
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_email:      adminEmail,
      action:          status === 'approved' ? 'approve_reschedule' : 'reject_reschedule',
      entity_type:     'reschedule_request',
      entity_id:       id,
      organization_id: data.organization_id ?? null,
      details: {
        customer_name:  (data.customers as any)?.full_name ?? null,
        customer_email: (data.customers as any)?.email ?? null,
        session_title:  data.session_title,
        session_date:   data.session_date,
        preferred_date: data.preferred_date,
        admin_note:     admin_note ?? null,
        status,
      }
    })
  } catch (_) {}

  return NextResponse.json(data)
}
