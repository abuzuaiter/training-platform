import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'


async function logAction(supabase: any, action: string, entity_type: string, entity_id?: string, details?: any) {
  try {
    await supabase.from('audit_logs').insert({
      user_email: 'admin',
      action,
      entity_type,
      entity_id: entity_id || null,
      details: details || null
    })
  } catch (e) {
    console.error('Audit log error:', e)
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*, organizations(id, name, email, mobile), organization_plans(*, plans(*))')
    .eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (body.status === 'paid') {
    await logAction(supabaseAdmin, 'paid', 'invoice', id, { invoice_number: data.invoice_number, amount: data.amount })
  }
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const updateData: any = { ...body }
  if (body.status === 'paid') updateData.paid_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('invoices').update(updateData).eq('id', id)
    .select('*, organizations(id, name, email), organization_plans(id, plans(*))').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-update organization plan payment status
  if (body.status === 'paid' && data.organization_plans?.id) {
    await supabaseAdmin
      .from('organization_plans')
      .update({ payment_status: 'paid' })
      .eq('id', data.organization_plans.id)
  }

  if (body.status === 'paid') {
    await logAction(supabaseAdmin, 'paid', 'invoice', id, { invoice_number: data.invoice_number, amount: data.amount })
  }
  return NextResponse.json(data)
}
