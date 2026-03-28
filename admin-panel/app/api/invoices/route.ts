import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*, organizations(id, name, email)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { organization_id, organization_plan_id, amount, type, notes } = body

  const { data: numData } = await supabaseAdmin.rpc('nextval', { seq: 'invoice_number_seq' })
  const invoice_number = 'INV-' + String(numData || Date.now()).padStart(6, '0')

  const { data, error } = await supabaseAdmin.from('invoices').insert({
    invoice_number,
    organization_id,
    organization_plan_id: organization_plan_id || null,
    amount,
    type: type || 'invoice',
    status: 'pending',
    notes: notes || null
  }).select('*, organizations(id, name, email)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
