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

  if (body.status === 'paid') body.paid_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('org_invoices').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (body.status === 'paid') {
    await logAudit({ action: 'paid', entity_type: 'invoice', entity_id: id, organization_id: data.organization_id, details: { invoice_number: data.invoice_number, amount: data.amount } })
  } else {
    await logAudit({ action: 'update', entity_type: 'invoice', entity_id: id, organization_id: data.organization_id, details: { status: data.status, invoice_number: data.invoice_number } })
  }
  return NextResponse.json(data)
}
