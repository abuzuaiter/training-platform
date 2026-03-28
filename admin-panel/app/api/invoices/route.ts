import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org_plan_id = searchParams.get('org_plan_id')

  let query = supabaseAdmin
    .from('invoices')
    .select('*, organizations(id, name, email)')
    .order('created_at', { ascending: false })

  if (org_plan_id) query = query.eq('organization_plan_id', org_plan_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { organization_id, organization_plan_id, amount, type, notes } = body

  const invoiceNumber = 'INV-' + Date.now().toString().slice(-6)

  const { data, error } = await supabaseAdmin.from('invoices').insert({
    invoice_number: invoiceNumber,
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
